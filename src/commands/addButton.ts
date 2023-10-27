import { Command } from "@sapphire/framework";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from "discord.js";
import { readFile } from "fs";

export class AddButtonCommand extends Command {
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
    const styleValue = interaction.options.getString('style', true);
    const action = interaction.options.getString('action', true);
    let style;

    const button = new ButtonBuilder()
    const row = new ActionRowBuilder<ButtonBuilder>()

    switch(styleValue) {
      case 'primary':
        style = ButtonStyle.Primary;
        break;
      case 'secondary':
        style = ButtonStyle.Secondary;
        break;
      case 'success':
        style = ButtonStyle.Success;
        break;
      case 'danger':
        style = ButtonStyle.Danger;
        break;
      case 'link':
        style = ButtonStyle.Link;
        break;
    }

    switch(styleValue) {
      case 'primary' || 'secondary' || 'success' || 'danger':
        this.container.logger.info('Message sending button being added');

        button
          .setCustomId("sendmsg" + "-" + action)
          .setLabel(label)
          .setStyle(style as ButtonStyle);

        row.addComponents(button);

        (await message)?.edit({ components: [row] })

        break;
      case 'link':
        this.container.logger.info('URL sending button being added');

        button
          .setCustomId("sendmsg" + "-" + action)
          .setLabel(label)
          .setStyle(style as ButtonStyle);

        row.addComponents(button);

        (await message)?.edit({ components: [row] })

        break;
    }
  }
}