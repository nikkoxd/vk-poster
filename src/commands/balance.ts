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
          .setDescription(t("commands.balance.description"))
          .addUserOption((option) =>
            option
              .setName(t("commands.balance.member.name"))
              .setDescription(t("commands.balance.member.description")),
          ),
      { idHints: [process.env.BALANCE_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const member = interaction.options.getUser(
      t("commands.balance.member.name"),
    );
    const memberId = member ? member.id : interaction.user.id;

    try {
      const memberItem = await Member.findOneAndUpdate(
        { memberId: memberId },
        { $setOnInsert: { coins: 0 } },
        { upsert: true, new: true },
      );

      interaction.reply(
        `${t("shop.balance")} ${memberItem.coins} ${t("shop.coins")}`,
      );
    } catch (err: any) {
      logError(err, interaction);
    }
  }
}
