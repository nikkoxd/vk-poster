import { Command } from "@sapphire/framework";
import { logError } from "..";
import { t } from "i18next";
import Member from "../schemas/Member";

export class RankCommand extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder.setName("rank").setDescription(t("commands.rank.description")),
      { idHints: [process.env.RANK_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const member = await Member.findOne({ memberId: interaction.user.id });
    if (member) {
      const required =
        100 * (member.level + 1) + Math.pow(member.level, 2) * 50;
      interaction.reply(
        `**Уровень:** ${member.level}\n**Опыт:** ${member.exp}/${required}`,
      );
    } else {
      const member = new Member({ memberId: interaction.user.id });
      const required =
        100 * (member.level + 1) + Math.pow(member.level, 2) * 50;
      interaction.reply(
        `**Уровень:** ${member.level}\n**Опыт:** ${member.exp}/${required}`,
      );
    }
  }
}
