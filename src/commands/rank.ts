import { Command } from "@sapphire/framework";
import { logError } from "..";
import i18next from "i18next";
import Member from "../schemas/Member";

export class RankCommand extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("rank")
          .setDescription(i18next.t("commands.rank.description"))
          .addUserOption((option) =>
            option
              .setName(i18next.t("commands.rank.member.name"))
              .setDescription(i18next.t("commands.rank.member.description")),
          ),
      { idHints: [process.env.RANK_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const member = interaction.options.getUser(
      i18next.t("commands.balance.member.name"),
    );
    const memberId = member ? member.id : interaction.user.id;

    try {
      const memberItem = await Member.findOneAndUpdate(
        { memberId: memberId },
        { $setOnInsert: { memberId: memberId } },
        { upsert: true, new: true },
      );
      const required =
        100 * (memberItem.level + 1) + Math.pow(memberItem.level, 2) * 50;
      interaction.reply(
        `**Уровень:** ${memberItem.level}\n**Опыт:** ${memberItem.exp}/${required}`,
      );
    } catch (err: any) {
      logError(err, interaction);
    }
  }
}
