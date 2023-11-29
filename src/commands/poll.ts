import { Subcommand } from "@sapphire/plugin-subcommands";
import { ChannelType, Message, PermissionFlagsBits } from "discord.js";

export class pollCommand extends Subcommand {
  constructor(context: Subcommand.LoaderContext, options: Subcommand.Options) {
    super(context, {
      ...options,
      name: "poll",
      subcommands: [
        {
          name: "start",
          chatInputRun: "chatInputStart",
        },
        {
          name: "edit",
          chatInputRun: "chatInputEdit",
        },
        {
          name: "end",
          chatInputRun: "chatInputEnd",
        },
      ],
    });
  }

  registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("poll")
          .setDescription("Создать/редактировать/завершить голосование")
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
          .addSubcommand((command) =>
            command
              .setName("start")
              .setDescription("Начать голосование")
              .addStringOption((option) =>
                option
                  .setName("text")
                  .setDescription("Текст")
                  .setRequired(true),
              )
              .addChannelOption((option) =>
                option
                  .setName("channel")
                  .setDescription("Канал для отправки")
                  .setRequired(false),
              ),
          )
          .addSubcommand((command) =>
            command
              .setName("edit")
              .setDescription("Редактировать голосование")
              .addStringOption((option) =>
                option
                  .setName("id")
                  .setDescription("Идентификатор сообщения")
                  .setRequired(true),
              )
              .addStringOption((option) =>
                option
                  .setName("text")
                  .setDescription("Новый текст")
                  .setRequired(true),
              ),
          )
          .addSubcommand((command) =>
            command
              .setName("end")
              .setDescription("Закончить голосование")
              .addStringOption((option) =>
                option
                  .setName("id")
                  .setDescription("Идентификатор сообщения")
                  .setRequired(true),
              ),
          ),
      { idHints: [process.env.POLL_ID as string] },
    );
  }

  private logError(
    interaction: Subcommand.ChatInputCommandInteraction,
    err: any,
  ) {
    interaction.reply({
      content: `При выполнении команды произошла ошибка:\n\`\`\`${err}\`\`\``,
      ephemeral: true,
    });
    this.container.logger.error("Error reading message:", err);
  }

  public async chatInputStart(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const text = interaction.options.getString("text", true);
    const channel = interaction.options.getChannel("channel", false, [
      ChannelType.GuildText,
    ]);

    try {
      if (channel) {
        const msg = await channel.send(text);
        if (process.env.REACT_YES && process.env.REACT_NO) {
          msg.react(process.env.REACT_YES);
          msg.react(process.env.REACT_NO);
        } else {
          msg.react("👍");
          msg.react("👎");
        }

        interaction.reply({
          content: `Голосование создано! 🎉\nПосмотреть: <#${channel.id}>`,
          ephemeral: true,
        });
      } else {
        const msg = await interaction.channel?.send(text);
        if (process.env.REACT_YES && process.env.REACT_NO) {
          (msg as Message).react(process.env.REACT_YES);
          (msg as Message).react(process.env.REACT_NO);
        } else {
          (msg as Message).react("👍");
          (msg as Message).react("👎");
        }

        interaction.reply({
          content: "Голосование создано! 🎉",
          ephemeral: true,
        });
      }
    } catch (err) {
      this.logError(interaction, err);
    }
  }

  public async chatInputEdit(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const messageID = interaction.options.getString("id", true);
    const message = interaction.channel?.messages.fetch(messageID);
    const text = interaction.options.getString("text", true);

    try {
      (await message)?.edit(text);
      interaction.reply({
        content: "Голосование изменено",
        ephemeral: true,
      });
    } catch (err) {
      this.logError(interaction, err);
    }
  }

  public async chatInputEnd(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const messageID = interaction.options.getString("id", true);
    const message = interaction.channel?.messages.fetch(messageID);

    try {
      if ((await message)?.reactions.cache.size) {
        const text = (await message)?.content;
        const reactions = (await message)?.reactions.cache;
        let reactionsYes;
        let reactionsNo;
        // Get reactions
        if (process.env.REACT_YES && process.env.REACT_NO) {
          reactionsYes = (await reactions)?.get(process.env.REACT_YES)?.count;
          reactionsNo = (await reactions)?.get(process.env.REACT_NO)?.count;
        } else {
          reactionsYes = (await reactions)?.get("👍")?.count;
          reactionsNo = (await reactions)?.get("👎")?.count;
        }
        // Edit the message
        (await message)?.edit(
          `**🎉 Голосование окончено**\n> ${text}\nЗа - ${
            (reactionsYes as number) - 1
          }   Против - ${(reactionsNo as number) - 1}`,
        );
        // Remove all reactions
        (await message)?.reactions.removeAll();
        interaction.reply({
          content: "Голосование окончено",
          ephemeral: true,
        });
      } else {
        throw new Error(
          "Message is either not a poll or the poll has already ended",
        );
      }
    } catch (err) {
      this.logError(interaction, err);
    }
  }
}
