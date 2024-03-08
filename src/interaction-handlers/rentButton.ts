import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import Guild from "../schemas/Guild";
import Member from "../schemas/Member";
import ms from "ms";
import i18next from "i18next";

export class RentButtonHandler extends InteractionHandler {
  public constructor(
    ctx: InteractionHandler.LoaderContext,
    options: InteractionHandler.Options,
  ) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    return interaction.customId == "room-rent" ? this.some() : this.none();
  }

  public async run(interaction: ButtonInteraction) {
    if (!interaction.guild) return;

    const modal = new ModalBuilder()
      .setCustomId("rent-modal")
      .setTitle(i18next.t("interaction-handlers.rentButton.modal.title"));

    const nameInput = new TextInputBuilder()
      .setCustomId("rent-name-input")
      .setLabel(i18next.t("interaction-handlers.rentButton.modal.fields.label"))
      .setPlaceholder(
        i18next.t("interaction-handlers.rentButton.modal.fields.placeholder"),
      )
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const durationInput = new TextInputBuilder()
      .setCustomId("rent-duration-input")
      .setLabel(
        i18next.t("interaction-handlers.rentButton.modal.duration.label"),
      )
      .setPlaceholder(
        i18next.t("interaction-handlers.rentButton.modal.duration.placeholder"),
      )
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const firstActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput);
    const secondActionRow =
      new ActionRowBuilder<TextInputBuilder>().addComponents(durationInput);

    modal.addComponents(firstActionRow, secondActionRow);

    await interaction.showModal(modal);

    const submitted = await interaction
      .awaitModalSubmit({
        time: 60_000,
        filter: (i) => i.user.id === interaction.user.id,
      })
      .catch((error) => {
        this.container.logger.error(error);
        return null;
      });

    if (submitted) {
      if (!submitted.guild) return;

      const guildConfig = await Guild.findOne({ id: process.env.GUILD_ID });
      if (!guildConfig) return;

      const { category, prefix, price } = guildConfig.rooms;
      if (!category) return;

      const nameValue = submitted.fields.getTextInputValue("rent-name-input");
      const durationValue = submitted.fields.getTextInputValue(
        "rent-duration-input",
      );

      let name: string;
      if (prefix) {
        if (nameValue) name = `${prefix} ${nameValue}`;
        else name = `${prefix} ${submitted.user.displayName}`;
      } else {
        if (nameValue) name = `${nameValue}`;
        else name = `${submitted.user.displayName}`;
      }

      let expiryDate = Date.now() + ms(durationValue);

      let member = await Member.findOne({
        memberId: submitted.user.id,
      });

      if (!member) {
        member = new Member({ memberId: submitted.user.id });
        member.save();
      }

      const pricePerMs = price / ms("1h");
      const finalPrice = Math.floor(ms(durationValue) * pricePerMs);

      if (member.coins < finalPrice) {
        submitted.reply({
          content: i18next.t("interaction-handlers.rentButton.notEnoughCoins"),
          ephemeral: true,
        });

        return;
      }

      const channel = await submitted.guild.channels.create({
        name: name,
        parent: category,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          {
            id: submitted.user.id,
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.ManageChannels,
            ],
          },
        ],
      });

      const optionsEmbed = new EmbedBuilder()
        .setTitle(i18next.t("listeners.voiceStateUpdate.embed.title"))
        .setColor(`#${guildConfig.embedColor}`)
        .setDescription(
          i18next.t("listeners.voiceStateUpdate.embed.description"),
        );

      const optionsRow1 = new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId("rooms-lock")
          .setLabel("🔒")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("rooms-unlock")
          .setLabel("🔓")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("rooms-newmod")
          .setLabel("🔧")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("rooms-removemod")
          .setLabel("🗑️")
          .setStyle(ButtonStyle.Secondary),
      ]);

      const optionsRow2 = new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId("rooms-enable-chatting")
          .setLabel("💬")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("rooms-disable-chatting")
          .setLabel("🤫")
          .setStyle(ButtonStyle.Secondary),
      ]);

      await channel.send({
        content: i18next.t("interaction-handlers.rentButton.expiresAt", {
          timestamp: Math.round(expiryDate / 1000),
        }),
        embeds: [optionsEmbed],
        components: [optionsRow1, optionsRow2],
      });

      const rooms = member.rooms;

      rooms.push({
        guildId: submitted.guild.id,
        channelId: channel.id,
        expiryDate: expiryDate,
      });

      await member.updateOne({
        coins: member.coins - finalPrice,
        rooms: rooms,
      });

      submitted.reply({
        content: i18next.t("interaction-handlers.rentButton.success", {
          channelId: channel.id,
        }),
        ephemeral: true,
      });
    }
  }
}
