import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  EmbedBuilder,
  type ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  Role,
  ButtonBuilder,
} from "discord.js";
import { t } from "i18next";
import ShopItem, { IShopItem } from "../schemas/ShopItem";
import Member from "../schemas/Member";

export class ShopButtonHandler extends InteractionHandler {
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
    return interaction.customId === ("shop" || "next-page" || "prev-page")
      ? this.some()
      : this.none();
  }

  private createEmbedFields(role: Role, roleItem: IShopItem) {
    let value = `**Цена:** ${roleItem.price} монеток`;
    if (roleItem.duration)
      value = `${value}\n**Длительность:** ${roleItem.duration}`;
    return {
      name: role ? role.name : "Unknown Role",
      value,
      inline: true,
    };
  }

  private async fetchShopRoles(interaction: ButtonInteraction) {
    const roles = await ShopItem.find();
    return Promise.all(
      roles.map(async (roleItem: IShopItem) => {
        try {
          const role = await interaction.guild!.roles.fetch(roleItem.roleId);
          return { role, roleItem };
        } catch (error) {
          this.container.logger.error(
            `Error fetching role ${roleItem.roleId}:`,
            error,
          );
          return { role: null, roleItem };
        }
      }),
    );
  }

  public async run(interaction: ButtonInteraction) {
    if (interaction.guild) {
      const memberItem = await Member.findOne({
        memberId: interaction.user.id,
      });
      if (!memberItem) {
        await Member.create({ memberId: interaction.user.id, coins: 0 });
      }
      const embed = new EmbedBuilder()
        .setTitle("Магазин")
        .setDescription(`Твой баланс: ${memberItem!.coins}`)
        .setColor(`#${process.env.EMBED_COLOR}`);
      const roleOptions: StringSelectMenuOptionBuilder[] = [];

      try {
        const roleData = await this.fetchShopRoles(interaction);
        const itemsPerPage = 9;
        const totalPages = Math.ceil(roleData.length / itemsPerPage);

        let page = 1;

        interaction.customId ? page++ : null;
        interaction.customId ? page-- : null;

        const startIdx = (page - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;

        const paginatedRoles = roleData.slice(startIdx, endIdx);

        paginatedRoles.forEach(({ role, roleItem }) => {
          if (role) {
            embed.addFields(this.createEmbedFields(role, roleItem));

            roleOptions.push(
              new StringSelectMenuOptionBuilder()
                .setLabel(role.name)
                .setValue(role.id)
                .setDescription(`Цена: ${roleItem.price}`),
            );
          }
        });

        const menu = new StringSelectMenuBuilder()
          .setCustomId("shop-select")
          .setPlaceholder(t("shop.selectRole"))
          .addOptions(roleOptions);

        const selectRow =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

        if (totalPages > 1) {
          const buttonRow = new ActionRowBuilder<ButtonBuilder>();
          buttonRow.addComponents(
            new ButtonBuilder()
              .setCustomId("prev-page")
              .setLabel("Предыдущая страница")
              .setStyle(1), // ButtonStyle.PRIMARY
            new ButtonBuilder()
              .setCustomId("next-page")
              .setLabel("Следующая страница")
              .setStyle(1), // ButtonStyle.PRIMARY
          );

          await interaction.reply({
            embeds: [embed],
            components: [selectRow, buttonRow],
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            embeds: [embed],
            components: [selectRow],
            ephemeral: true,
          });
        }
      } catch (error) {
        this.container.logger.error("Error fetching shop roles:", error);
      }
    }
  }
}
