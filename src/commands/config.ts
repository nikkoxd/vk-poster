import { Command } from "@sapphire/framework";
import i18next from "i18next";
import { PermissionFlagsBits } from "discord.js";

export class configCommand extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("config")
          .setDescription(i18next.t("commands.config.description"))
          .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      { idHints: [process.env.CONFIG_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    interaction.reply({
      content: "Чтобы редактировать конфиг бота, перейди по [этой ссылке](https://stella-web-inky.vercel.app)",
      ephemeral: true,
    });
  }
}
