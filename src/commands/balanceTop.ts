import { Command } from "@sapphire/framework";
import { logError } from "..";
import { t } from "i18next";
import Member from "../schemas/Member";
import { EmbedBuilder } from "discord.js";
import Guild from "../schemas/Guild";

export class balanceTop extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("balance-top")
          .setDescription(t("commands.balance-top.description")),
      { idHints: [process.env.BALANCE_TOP_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const guild = await Guild.findOne({ id: process.env.GUILD_ID });
    const members = await Member.find().limit(10).sort({ coins: -1 });
    const embed = new EmbedBuilder();
    if (guild) {
      embed.setColor(`#${guild.embedColor}`);
    } else {
      const guild = new Guild({ id: process.env.GUILD_ID });
      guild.save();

      embed.setColor(`#${guild.embedColor}`);
    }
    if (interaction.guild) {
      embed.setTitle(t("commands.balance-top.embed.title"));
      let description = "";
      for (let i = 0; i < members.length; i++) {
        description =
          description +
          `**${i + 1}.** <@${members[i].memberId}>: ${
            members[i].coins
          } монеток\n`;
      }
      embed.setDescription(description);
      interaction.reply({ embeds: [embed] });
    }
  }
}
