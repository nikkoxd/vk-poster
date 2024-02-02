import { Subcommand } from "@sapphire/plugin-subcommands";
import { logError } from "..";
import { t } from "i18next";
import { PermissionFlagsBits } from "discord.js";
import Member from "../schemas/Member";

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
      level++;
      reqExp = 100 * (level + 1) + Math.pow(level, 2) * 50;
    }

    return level;
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
      const dbMember = await Member.findOne({ memberId: member.id });
      if (dbMember) {
        await dbMember.updateOne({ coins: amount });
      } else {
        await Member.create({ memberId: member.id, coins: amount });
      }
      interaction.reply({
        content: `Баланс ${member.displayName} теперь составляет ${amount} монеток`,
        ephemeral: true,
      });
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
      const dbMember = await Member.findOne({ memberId: member.id });
      if (dbMember) {
        await dbMember.updateOne({ exp: amount, level: level });
      } else {
        await Member.create({ memberId: member.id, exp: amount, level: level });
      }

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
    const exp = 100 * level + Math.pow(level - 1, 2) * 50;

    try {
      const dbMember = await Member.findOne({ memberId: member.id });
      if (dbMember) {
        await dbMember.updateOne({ exp: exp, level: level });
      } else {
        await Member.create({ memberId: member.id, exp: exp, level: level });
      }

      interaction.reply({
        content: `Опыт ${member.displayName} теперь составляет ${exp} и его уровень ${level}`,
        ephemeral: true,
      });
    } catch (err: any) {
      logError(err, interaction);
    }
  }
}
