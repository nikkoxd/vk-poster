import { Subcommand } from "@sapphire/plugin-subcommands";
import { logError } from "..";
import i18next from "i18next";
import RoleReward from "../schemas/RoleReward";
import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import Guild from "../schemas/Guild";

export class RewardCommand extends Subcommand {
  public constructor(
    ctx: Subcommand.LoaderContext,
    options: Subcommand.Options,
  ) {
    super(ctx, {
      ...options,
      name: "reward",
      subcommands: [
        {
          name: "add",
          chatInputRun: "chatInputAdd",
        },
        {
          name: "remove",
          chatInputRun: "chatInputRemove",
        },
        {
          name: "list",
          chatInputRun: "chatInputList",
        },
      ],
    });
  }

  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("reward")
          .setDescription(i18next.t("commands.reward.description"))
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
          .addSubcommand((command) =>
            command
              .setName("add")
              .setDescription(i18next.t("commands.reward.add.description"))
              .addRoleOption((option) =>
                option
                  .setName(i18next.t("commands.reward.role.name"))
                  .setDescription(i18next.t("commands.reward.role.description"))
                  .setRequired(true),
              )
              .addIntegerOption((option) =>
                option
                  .setName(i18next.t("commands.reward.level.name"))
                  .setDescription(
                    i18next.t("commands.reward.level.description"),
                  )
                  .setRequired(true),
              ),
          )
          .addSubcommand((command) =>
            command
              .setName("remove")
              .setDescription(i18next.t("commands.reward.remove.description"))
              .addIntegerOption((option) =>
                option
                  .setName(i18next.t("commands.reward.level.name"))
                  .setDescription(
                    i18next.t("commands.reward.level.description"),
                  )
                  .setRequired(true),
              ),
          )
          .addSubcommand((command) =>
            command
              .setName("list")
              .setDescription(i18next.t("commands.reward.list.description")),
          ),
      { idHints: [process.env.REWARD_ID as string] },
    );
  }

  public async chatInputAdd(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const role = interaction.options.getRole(
      i18next.t("commands.reward.role.name"),
      true,
    );
    const level = interaction.options.getInteger(
      i18next.t("commands.reward.level.name"),
      true,
    );

    let dbRole = await RoleReward.findOne({ id: role.id, level: level });

    if (dbRole) {
      interaction.reply({
        content: i18next.t("commands.reward.reply.rewardAlreadyExists"),
        ephemeral: true,
      });
      return;
    }

    dbRole = new RoleReward({ id: role.id, level: level });
    dbRole.save();

    interaction.reply({
      content: i18next.t("commands.reward.reply.rewardAdded", {
        level: level,
        roleId: role.id,
      }),
      ephemeral: true,
    });
  }

  public async chatInputRemove(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const level = interaction.options.getInteger(
      i18next.t("commands.reward.level.name"),
      true,
    );

    const dbRole = await RoleReward.findOne({ level: level });

    if (!dbRole) {
      interaction.reply({
        content: i18next.t("commands.reward.reply.rewardDoesNotExist", {
          level: level,
        }),
        ephemeral: true,
      });
      return;
    }

    await dbRole.deleteOne();
    interaction.reply({
      content: i18next.t("commands.reward.reply.rewardRemoved", {
        level: level,
      }),
      ephemeral: true,
    });
  }

  public async chatInputList(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    if (!interaction.guild) return;

    let config = await Guild.findOne({ id: interaction.guild.id });
    if (!config) {
      config = new Guild({ id: interaction.guild.id });
      config.save();
    }

    const roles = await RoleReward.find();

    let description = "";
    roles.forEach(
      (role) =>
        (description += i18next.t("commands.reward.embed.reward", {
          level: role.level,
          roleId: role.id,
        })),
    );

    const embed = new EmbedBuilder()
      .setTitle(i18next.t("commands.reward.embed.title"))
      .setDescription(description)
      .setColor(`#${config.embedColor}`);

    interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  }
}
