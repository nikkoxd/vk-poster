import { Command } from "@sapphire/framework";
import { REST, PermissionFlagsBits, Routes } from "discord.js";

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
          .setDescription("Удалить все команды")
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
            content:
              "Все команды были удалены. Перезапустите бота чтобы обновить команды.",
            ephemeral: true,
          }),
        )
        .catch(this.container.logger.error);
    } else {
      interaction.reply({
        content: "Для выполнения этой команды требуется среда `development`",
        ephemeral: true,
      });
    }
  }
}
