import { Command } from "@sapphire/framework";
import { logError } from "..";
import { t } from "i18next";
import Member from "../schemas/Member";

export class balanceCommand extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("balance")
          .setDescription(t("commands.balance.description")),
      { idHints: [process.env.BALANCE_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const memberId = interaction.user.id;
    const member = await Member.findOne({ memberId: memberId });

    if (member) {
      interaction.reply(
        `${t("shop.balance")} ${member.coins} ${t("shop.coins")}`,
      );
    } else {
      const member = new Member({ memberId: memberId, coins: 0 });
      member.save();

      interaction.reply(
        `${t("shop.balance")} ${member.coins} ${t("shop.coins")}`,
      );
    }
  }
}
