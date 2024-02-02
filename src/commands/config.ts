import { Command } from "@sapphire/framework";
import { logError } from "..";
import { t } from "i18next";
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
          .setDescription(t("commands.config.description"))
          .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
          .addStringOption((option) =>
            option
              .setName(t("commands.config.optionOne.name"))
              .setDescription(t("commands.config.optionOne.description"))
              .addChoices(
                {
                  name: t("commands.config.language"),
                  value: "language",
                },
                {
                  name: t("commands.config.embedColor"),
                  value: "embedColor",
                },
                {
                  name: t("commands.config.memberRole"),
                  value: "memberRole",
                },
                {
                  name: t("commands.config.welcomeConfig"),
                  value: "welcomeConfig",
                },
                {
                  name: t("commands.config.reactionConfig"),
                  value: "reactionConfig",
                },
                {
                  name: t("commands.config.coinsConfig"),
                  value: "coinsConfig",
                },
                {
                  name: t("commands.config.expConfig"),
                  value: "expConfig",
                },
              )
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName(t("commands.config.optionTwo.name"))
              .setDescription(t("commands.config.optionTwo.description"))
              .addChoices(
                {
                  name: t("commands.config.welcomeChannelId"),
                  value: "welcomeChannelId",
                },
                {
                  name: t("commands.config.welcomeRoleId"),
                  value: "welcomeRoleId",
                },
                {
                  name: t("commands.config.reactionYes"),
                  value: "reactionYes",
                },
                {
                  name: t("commands.config.reactionNo"),
                  value: "reactionNo",
                },
                {
                  name: t("commands.config.coinsCooldown"),
                  value: "coinsCooldown",
                },
                {
                  name: t("commands.config.coinsMin"),
                  value: "coinsMin",
                },
                {
                  name: t("commands.config.coinsMax"),
                  value: "coinsMax",
                },
                {
                  name: t("commands.config.expCooldown"),
                  value: "coinsCooldown",
                },
                {
                  name: t("commands.config.expMin"),
                  value: "coinsMin",
                },
                {
                  name: t("commands.config.expMax"),
                  value: "coinsMax",
                },
              ),
          )
          .addStringOption((option) =>
            option
              .setName(t("commands.config.value.name"))
              .setDescription(t("commands.config.value.description")),
          ),
      { idHints: [process.env.CONFIG_ID as string] },
    );
  }

  private respond(
    interaction: Command.ChatInputCommandInteraction,
    option: string,
    value: string,
  ) {
    interaction.reply({
      content: `\`${option}\` ${t("commands.config.wasSetTo")} \`${value}\``,
      ephemeral: true,
    });
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const option1 = interaction.options.getString(
      t("commands.config.optionOne.name"),
      true,
    );
    const option2 = interaction.options.getString(
      t("commands.config.optionTwo.name"),
      false,
    );
    const value = interaction.options.getString(
      t("commands.config.value.name"),
      false,
    );

    if (
      (option1 == "welcomeConfig" && !option2) ||
      (option1 == "reactionConfig" && !option2) ||
      (option1 == "coinsConfig" && !option2) ||
      (option1 == "expConfig" && !option2)
    ) {
      logError("option2 parameter not present", interaction);
    }
    if (!value) logError("value parameter not present", interaction);

    const guildId = process.env.GUILD_ID;
    const guild = await Guild.findOne({ id: guildId });

    if (guild) {
      switch (option1) {
        case "language":
          await guild.updateOne({ language: value });
          this.respond(interaction, option1, value!);
          break;
        case "embedColor":
          await guild.updateOne({ embedColor: value });
          this.respond(interaction, option1, value!);
          break;
        case "memberRole":
          await guild.updateOne({ memberRoleId: value });
          this.respond(interaction, option1, value!);
          break;
        case "welcomeConfig":
          switch (option2) {
            case "welcomeChannelId":
              await guild.updateOne({
                welcome: { channelId: value, roleId: guild.welcome.roleId },
              });
              this.respond(interaction, option2, value!);
              break;
            case "welcomeRoleId":
              await guild.updateOne({
                welcome: { channelId: guild.welcome.channelId, roleId: value },
              });
              this.respond(interaction, option2, value!);
              break;
            default:
              logError(`No correct option2 found for ${option1}`, interaction);
              break;
          }
          break;
        case "reactionConfig":
          switch (option2) {
            case "reactionYes":
              await guild.updateOne({
                reactions: { yes: value, no: guild.reactions.no },
              });
              this.respond(interaction, option2, value!);
              break;
            case "reactionNo":
              await guild.updateOne({
                reactions: { yes: guild.reactions.yes, no: value },
              });
              this.respond(interaction, option2, value!);
              break;
            default:
              logError(`No correct option2 found for ${option1}`, interaction);
              break;
          }
          break;
        case "coinsConfig":
          switch (option2) {
            case "coinsCooldown":
              await guild.updateOne({
                coins: {
                  cooldown: value,
                  min: guild.coins.min,
                  max: guild.coins.max,
                },
              });
              this.respond(interaction, option2, value!);
              break;
            case "coinsMin":
              await guild.updateOne({
                coins: {
                  cooldown: guild.coins.cooldown,
                  min: Number(value),
                  max: guild.coins.max,
                },
              });
              this.respond(interaction, option2, value!);
              break;
            case "coinsMax":
              await guild.updateOne({
                coins: {
                  cooldown: guild.coins.cooldown,
                  min: guild.coins.min,
                  max: Number(value),
                },
              });
              this.respond(interaction, option2, value!);
              break;
            default:
              logError(`No correct option2 found for ${option1}`, interaction);
              break;
          }
          break;
        case "expConfig":
          switch (option2) {
            case "expCooldown":
              await guild.updateOne({
                exp: {
                  cooldown: value,
                  min: guild.exp.min,
                  max: guild.exp.max,
                },
              });
              this.respond(interaction, option2, value!);
              break;
            case "expMin":
              await guild.updateOne({
                exp: {
                  cooldown: guild.exp.cooldown,
                  min: Number(value),
                  max: guild.exp.max,
                },
              });
              this.respond(interaction, option2, value!);
              break;
            case "expMax":
              await guild.updateOne({
                exp: {
                  cooldown: guild.exp.cooldown,
                  min: guild.exp.min,
                  max: Number(value),
                },
              });
              this.respond(interaction, option2, value!);
              break;
            default:
              logError(`No correct option2 found for ${option1}`, interaction);
              break;
          }
          break;
        default:
          logError(`No correct option1 found`, interaction);
          break;
      }
    } else {
      if (guildId) {
        Guild.create({ id: guildId });
      } else {
        logError("GUILD_ID environment variable not set", interaction);
      }
    }
  }
}
