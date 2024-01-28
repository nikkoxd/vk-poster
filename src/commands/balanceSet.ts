import { Command } from "@sapphire/framework";
import { logError } from "..";
import { t } from "i18next";
import Member from "../schemas/Member";

export class balanceSetCommand extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("balance-set")
          .setDescription(t("commands.set-balance.description"))
          .addUserOption((option) =>
            option
              .setName(t("commands.set-balance.member.name"))
              .setDescription(t("commands.set-balance.member.description"))
              .setRequired(true),
          )
          .addIntegerOption((option) =>
            option
              .setName(t("commands.set-balance.amount.name"))
              .setDescription(t("commands.set-balance.amount-description"))
              .setRequired(true),
          ),
      { idHints: [process.env.BALANCE_SET_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const member = interaction.options.getUser("member", true);
    const amount = interaction.options.getInteger("amount", true);

    try {
      const dbMember = await Member.findOne({ memberId: member.id });
      if (dbMember) {
        await Member.updateOne({ coins: amount });
      } else {
        await Member.create({ memberId: member.id, coins: amount });
      }
      interaction.reply(
        "Баланс " +
          member.displayName +
          " теперь составляет " +
          amount +
          " монеток",
      );
    } catch (err: any) {
      logError(err, interaction);
    }
  }
}
