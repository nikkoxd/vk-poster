import { Subcommand } from "@sapphire/plugin-subcommands";
import { logError } from "..";
import { t } from "i18next";
import { GuildMemberRoleManager, PermissionFlagsBits, Role } from "discord.js";
import Member, { IMember } from "../schemas/Member";
import RoleReward, { IRoleReward } from "../schemas/RoleReward";

export class SetCommand extends Subcommand {
  public constructor(
    ctx: Subcommand.LoaderContext,
    options: Subcommand.Options,
  ) {
    super(ctx, {
      ...options,
      name: "set",
      subcommands: [
        {
          name: "coins",
          chatInputRun: "chatInputCoins",
        },
        {
          name: "exp",
          chatInputRun: "chatInputExp",
        },
        {
          name: "level",
          chatInputRun: "chatInputLevel",
        },
      ],
    });
  }

  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("set")
          .setDescription(t("commands.set.description"))
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
          .addSubcommand((command) =>
            command
              .setName("coins")
              .setDescription(t("commands.set.coins.description"))
              .addUserOption((option) =>
                option
                  .setName(t("commands.set.coins.member.name"))
                  .setDescription(t("commands.set.coins.member.description"))
                  .setRequired(true),
              )
              .addIntegerOption((option) =>
                option
                  .setName(t("commands.set.coins.amount.name"))
                  .setDescription(t("commands.set.coins.amount.description"))
                  .setRequired(true),
              ),
          )
          .addSubcommand((command) =>
            command
              .setName("exp")
              .setDescription(t("commands.set.exp.description"))
              .addUserOption((option) =>
                option
                  .setName(t("commands.set.exp.member.name"))
                  .setDescription(t("commands.set.exp.member.description"))
                  .setRequired(true),
              )
              .addIntegerOption((option) =>
                option
                  .setName(t("commands.set.exp.amount.name"))
                  .setDescription(t("commands.set.exp.amount.description"))
                  .setRequired(true),
              ),
          )
          .addSubcommand((command) =>
            command
              .setName("level")
              .setDescription(t("commands.set.level.description"))
              .addUserOption((option) =>
                option
                  .setName(t("commands.set.level.member.name"))
                  .setDescription(t("commands.set.level.member.description"))
                  .setRequired(true),
              )
              .addIntegerOption((option) =>
                option
                  .setName(t("commands.set.level.level.name"))
                  .setDescription(t("commands.set.level.level.description"))
                  .setRequired(true),
              ),
          ),
      { idHints: [] },
    );
  }

  private calculateLevel(exp: number): number {
    let level = 0;
    let reqExp = 0;

    while (exp >= reqExp) {
      reqExp = 100 * (level + 1) + Math.pow(level, 2) * 50;
      level++;
    }

    return level - 1;
  }

  public async chatInputCoins(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const member = interaction.options.getUser(
      t("commands.set.coins.member.name"),
      true,
    );
    const amount = interaction.options.getInteger(
      t("commands.set.coins.amount.name"),
      true,
    );

    try {
      const dbMember = await Member.findOneAndUpdate(
        { memberId: member.id },
        { coins: amount },
        { upsert: true },
      );

      interaction.reply({
        content: `Баланс ${member.displayName} теперь составляет ${amount} монеток`,
        ephemeral: true,
      });
    } catch (err: any) {
      logError(err, interaction);
    }
  }

  private async processRoles(
    interaction: Subcommand.ChatInputCommandInteraction,
    member: IMember,
  ) {
    const roleManager = interaction.member!.roles as GuildMemberRoleManager;

    const level = member.level;
    const roles = await RoleReward.find().sort({ level: 1 });

    try {
      if (roles && interaction.member) {
        let roleReward: IRoleReward | null = await RoleReward.findOne({
          level: level,
        });

        roles.forEach((role: IRoleReward) => {
          if (role.level <= level) {
            roleReward = role;
          }
          if (roleManager.cache.has(role.id)) {
            roleManager.remove(role.id);
          }
        });

        if (roleReward) {
          roleManager.add(roleReward.id);
        }
      }
    } catch (err: any) {
      logError(err, interaction);
    }
  }

  public async chatInputExp(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const member = interaction.options.getUser(
      t("commands.set.exp.member.name"),
      true,
    );
    const amount = interaction.options.getInteger(
      t("commands.set.exp.amount.name"),
      true,
    );
    const level = this.calculateLevel(amount);

    try {
      let dbMember = await Member.findOneAndUpdate(
        { memberId: member.id },
        { exp: amount, level: level },
        { upsert: true, new: true },
      );

      this.processRoles(interaction, dbMember);

      interaction.reply({
        content: `Опыт ${member.displayName} теперь составляет ${amount} и его уровень ${level}`,
        ephemeral: true,
      });
    } catch (err: any) {
      logError(err, interaction);
    }
  }

  public async chatInputLevel(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const member = interaction.options.getUser(
      t("commands.set.level.member.name"),
      true,
    );
    const level = interaction.options.getInteger(
      t("commands.set.level.level.name"),
      true,
    );
    const exp = level ? 100 * level + Math.pow(level - 1, 2) * 50 : 0;

    try {
      let dbMember = await Member.findOneAndUpdate(
        { memberId: member.id },
        { exp: exp, level: level },
        { upsert: true, new: true },
      );

      this.processRoles(interaction, dbMember);

      interaction.reply({
        content: `Опыт ${member.displayName} теперь составляет ${exp} и его уровень ${level}`,
        ephemeral: true,
      });
    } catch (err: any) {
      logError(err, interaction);
    }
  }
}
