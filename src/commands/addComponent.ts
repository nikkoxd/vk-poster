import { Command } from "@sapphire/framework";
import { PermissionFlagsBits } from "discord.js";
import { readFile } from "fs";

export class AddComponentCommand extends Command {
  public constructor(ctx: Command.Context, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('addcomponent')
        .setDescription('Добавить компонент к сообщению.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption((option) =>
          option
            .setName('id')
            .setDescription('Идентификатор сообщения')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('type')
            .setDescription('Тип компонента')
            .addChoices(
              { name: 'Кнопка для отправки сообщения', value: 'sendMsgButton' },
            )
            .setRequired(true)
        )
    )
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const message = interaction.channel?.messages.fetch(interaction.options.getString('id', true));
    const type = interaction.options.getString
  }
}