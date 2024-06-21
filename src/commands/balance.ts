import { Command } from "@sapphire/framework";
import i18next from "i18next";
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
          .setDescription(i18next.t("commands.balance.description"))
          .addUserOption((option) =>
            option
              .setName(i18next.t("commands.balance.member.name"))
              .setDescription(i18next.t("commands.balance.member.description")),
          ),
      { idHints: [process.env.BALANCE_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const inputMember = interaction.options.getUser(
      i18next.t("commands.balance.member.name"),
    );
    const memberId = inputMember ? inputMember.id : interaction.user.id;

    const memberEntry = await Member.findOneAndUpdate(
      { memberId: memberId },
      { $setOnInsert: { coins: 0 } },
      { upsert: true, new: true },
    );

    interaction.reply(
      `${i18next.t("shop.balance")} ${memberEntry.coins} ${i18next.t("shop.coins")}`,
    );
  }
}
