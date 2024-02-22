import { Command } from "@sapphire/framework";
import { REST, PermissionFlagsBits, Routes } from "discord.js";
import { t } from "i18next";

const rest = new REST().setToken(process.env.TOKEN as string);

export class cleanUpCmdsCommand extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("cleanupcmds")
          .setDescription(t("commands.cleanUpCmds.description"))
          .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      { idHints: [process.env.CLEANUPCMDS_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    if (process.env.NODE_ENV == "development") {
      rest
        .put(Routes.applicationCommands(process.env.CLIENT_ID as string), {
          body: [],
        })
        .then(() =>
          interaction.reply({
            content: t("commands.cleanUpCmds.success"),
            ephemeral: true,
          }),
        )
        .catch(this.container.logger.error);
    } else {
      interaction.reply({
        content: t("commands.cleanUpCmds.failure"),
        ephemeral: true,
      });
    }
  }
}
