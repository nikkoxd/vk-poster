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
        .setDescription('Добавить кнопку к сообщению.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption((option) =>
          option
            .setName('id')
            .setDescription('Идентификатор сообщения')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('label')
            .setDescription('Текст на кнопке')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('style')
            .setDescription('Тип кнопки')
            .addChoices(
              { name: 'Основная', value: 'primary' },
              { name: 'Вторичная', value: 'secondary' },
              { name: 'Успех', value: 'success' },
              { name: 'Внимание', value: 'danger' },
              { name: 'Ссылка', value: 'link' }
            )
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('action')
            .setDescription('ID сообщения для отправки/URL для открытия')
            .setRequired(true)
        )
    , { idHints: ['1167543873745199106'] })
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const message = interaction.channel?.messages.fetch(interaction.options.getString('id', true));
    const label = interaction.options.getString('label', true);
    const style = interaction.options.getString('style', true);
    const action = interaction.options.getString('action', true);

    switch(label) {
      case 'primary' || 'secondary' || 'success' || 'danger':
        this.container.logger.info('Message sending button being added');
        break;
      case 'link':
        this.container.logger.info('URL sending button being added');
        break;
    }
  }
}