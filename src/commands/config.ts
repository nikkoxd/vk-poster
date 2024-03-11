import { Command } from "@sapphire/framework";
import i18next from "i18next";
import { PermissionFlagsBits } from "discord.js";
import Guild from "../schemas/Guild";

export class configCommand extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("config")
          .setDescription(i18next.t("commands.config.description"))
          .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
          .addStringOption((option) =>
            option
              .setName(i18next.t("commands.config.param.name"))
              .setDescription(i18next.t("commands.config.param.description"))
              .addChoices(
                {
                  name: i18next.t("commands.config.language"),
                  value: "language",
                },
                {
                  name: i18next.t("commands.config.logChannel"),
                  value: "logChannel",
                },
                {
                  name: i18next.t("commands.config.embedColor"),
                  value: "embedColor",
                },
                {
                  name: i18next.t("commands.config.memberRole"),
                  value: "memberRole",
                },
                {
                  name: i18next.t("commands.config.welcomeChannelId"),
                  value: "welcomeChannelId",
                },
                {
                  name: i18next.t("commands.config.welcomeRoleId"),
                  value: "welcomeRoleId",
                },
                {
                  name: i18next.t("commands.config.reactionYes"),
                  value: "reactionYes",
                },
                {
                  name: i18next.t("commands.config.reactionNo"),
                  value: "reactionNo",
                },
                {
                  name: i18next.t("commands.config.coinsCooldown"),
                  value: "coinsCooldown",
                },
                {
                  name: i18next.t("commands.config.coinsMin"),
                  value: "coinsMin",
                },
                {
                  name: i18next.t("commands.config.coinsMax"),
                  value: "coinsMax",
                },
                {
                  name: i18next.t("commands.config.coinsBumpReward"),
                  value: "coinsBumpReward",
                },
                {
                  name: i18next.t("commands.config.expCooldown"),
                  value: "expCooldown",
                },
                {
                  name: i18next.t("commands.config.expMin"),
                  value: "expMin",
                },
                {
                  name: i18next.t("commands.config.expMax"),
                  value: "expMax",
                },
                {
                  name: i18next.t("commands.config.roomsCategory"),
                  value: "roomsCategory",
                },
                {
                  name: i18next.t("commands.config.roomsPrefix"),
                  value: "roomsPrefix",
                },
                {
                  name: i18next.t("commands.config.roomsPrice"),
                  value: "roomsPrice",
                },
              )
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName(i18next.t("commands.config.value.name"))
              .setDescription(i18next.t("commands.config.value.description"))
              .setRequired(true),
          ),
      { idHints: [process.env.CONFIG_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const param = interaction.options.getString(
      i18next.t("commands.config.param.name"),
      true,
    );
    const value = interaction.options.getString(
      i18next.t("commands.config.value.name"),
      true,
    );

    const guildId = process.env.GUILD_ID;
    let guild = await Guild.findOne({ id: guildId });

    if (!guildId) {
      this.container.client.error(
        "GUILD_ID environment variable not set",
        interaction,
      );
      return;
    }
    if (!guild) {
      guild = new Guild({ id: guildId });
      guild.save();
    }

    switch (param) {
      case "language":
        await guild.updateOne({
          language: value,
        });
        break;
      case "logChannel":
        await guild.updateOne({
          logChannel: value,
        });
        break;
      case "embedColor":
        await guild.updateOne({
          embedColor: value,
        });
        break;
      case "memberRole":
        await guild.updateOne({
          memberRoleId: value,
        });
        break;
      case "welcomeChannelId":
        await guild.updateOne({
          welcome: {
            channelId: value,
            roleId: guild.welcome.roleId,
          },
        });
        break;
      case "welcomeRoleId":
        await guild.updateOne({
          welcome: {
            channelId: guild.welcome.channelId,
            roleId: value,
          },
        });
        break;
      case "reactionYes":
        await guild.updateOne({
          reactions: {
            yes: value,
            no: guild.reactions.no,
          },
        });
        break;
      case "reactionNo":
        await guild.updateOne({
          reactions: {
            yes: guild.reactions.yes,
            no: value,
          },
        });
        break;
      case "coinsCooldown":
        await guild.updateOne({
          coins: {
            cooldown: value,
            min: guild.coins.min,
            max: guild.coins.max,
            bumpReward: guild.coins.bumpReward,
          },
        });
        break;
      case "coinsMin":
        await guild.updateOne({
          coins: {
            cooldown: guild.coins.cooldown,
            min: Number(value),
            max: guild.coins.max,
            bumpReward: guild.coins.bumpReward,
          },
        });
        break;
      case "coinsMax":
        await guild.updateOne({
          coins: {
            cooldown: guild.coins.cooldown,
            min: guild.coins.min,
            max: Number(value),
            bumpReward: guild.coins.bumpReward,
          },
        });
        break;
      case "coinsBumpReward":
        await guild.updateOne({
          coins: {
            cooldown: guild.coins.cooldown,
            min: guild.coins.min,
            max: guild.coins.max,
            bumpReward: Number(value),
          },
        });
        break;
      case "expCooldown":
        await guild.updateOne({
          exp: {
            cooldown: value,
            min: guild.exp.min,
            max: guild.exp.max,
          },
        });
        break;
      case "expMin":
        await guild.updateOne({
          exp: {
            cooldown: guild.exp.cooldown,
            min: Number(value),
            max: guild.exp.max,
          },
        });
        break;
      case "expMax":
        await guild.updateOne({
          exp: {
            cooldown: guild.exp.cooldown,
            min: guild.exp.min,
            max: Number(value),
          },
        });
        break;
      case "roomsCategory":
        await guild.updateOne({
          rooms: {
            category: value,
            prefix: guild.rooms.prefix,
            price: guild.rooms.price,
          },
        });
        break;
      case "roomsPrefix":
        await guild.updateOne({
          rooms: {
            category: guild.rooms.category,
            prefix: value,
            price: guild.rooms.price,
          },
        });
        break;
      case "roomsPrice":
        await guild.updateOne({
          rooms: {
            category: guild.rooms.category,
            prefix: guild.rooms.prefix,
            price: Number(value),
          },
        });
        break;
      default:
        this.container.client.error("No correct parameter found", interaction);
        return;
    }
    this.container.client.log(
      interaction,
      i18next.t("commands.config.log.title"),
      i18next.t("commands.config.log.description", {
        memberId: interaction.user.id,
        param: param,
        value: value,
      }),
    );

    interaction.reply({
      content: `\`${param}\` ${i18next.t("commands.config.wasSetTo")} \`${value}\``,
      ephemeral: true,
    });
  }
}
