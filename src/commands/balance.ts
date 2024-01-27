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
      (builder) => builder.setName("balance").setDescription("Get balance"),
      { idHints: ["1200898668363001856"] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const memberId = interaction.user.id;
    const member = await Member.findOne({ memberId: memberId });

    if (member) {
      interaction.reply("Твой баланс: " + member.coins + " монет");
    } else {
      await Member.create({ memberId: memberId, coins: 0 });
      interaction.reply("Твой баланс: 0 монет");
    }
  }
}
