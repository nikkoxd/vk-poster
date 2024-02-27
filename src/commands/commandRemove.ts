import { Command } from "@sapphire/framework";
import { logError } from "..";
import i18next from "i18next";
import { PermissionFlagsBits, REST, Routes } from "discord.js";

export class CommandRemove extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          // TODO: Add translations
          .setName("command-remove")
          .setDescription("Remove a command")
          .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
          .addBooleanOption((option) =>
            option
              .setName("is_global")
              .setDescription("Is command a global command?")
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName("command_id")
              .setDescription("Command ID")
              .setRequired(true),
          ),
      { idHints: [] },
    );
  }

  public async processGlobalCommand(
    interaction: Command.ChatInputCommandInteraction,
    rest: REST,
    commandId: string,
  ) {
    rest
      .delete(
        Routes.applicationCommand(process.env.CLIENT_ID as string, commandId),
      )
      .then(() =>
        interaction.reply({
          content: `Global command with ID ${commandId} has been deleted`,
          ephemeral: true,
        }),
      )
      .catch(this.container.logger.error);
  }

  public async processGuildCommand(
    interaction: Command.ChatInputCommandInteraction,
    rest: REST,
    commandId: string,
  ) {
    rest
      .delete(
        Routes.applicationGuildCommand(
          process.env.CLIENT_ID as string,
          interaction.guild!.id,
          commandId,
        ),
      )
      .then(() =>
        interaction.reply({
          content: `Guild command with ID ${commandId} has been deleted`,
          ephemeral: true,
        }),
      )
      .catch(this.container.logger.error);
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const isGlobal = interaction.options.getBoolean("is_global", true);
    const commandId = interaction.options.getString("command_id", true);
    const ownerId = process.env.OWNER_ID;

    if (interaction.user.id == ownerId) {
      const rest = new REST().setToken(process.env.TOKEN as string);

      if (isGlobal) {
        this.processGlobalCommand(interaction, rest, commandId);
      } else {
        this.processGuildCommand(interaction, rest, commandId);
      }
    } else {
      interaction.reply({
        content: "Only the bot owner can use this command!",
        ephemeral: true,
      });
    }
  }
}
