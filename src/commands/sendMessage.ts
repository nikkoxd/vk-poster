import { Command } from "@sapphire/framework";
import {
  AttachmentBuilder,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { readFile } from "fs";

export class SendMessageCommand extends Command {
  public constructor(ctx: Command.Context, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("sendmsg")
          .setDescription("Отправить сообщение в чат")
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
          .addStringOption((option) =>
            option
              .setName("id")
              .setDescription("Идентификатор сообщения для отправки")
              .setRequired(true),
          )
          .addChannelOption((option) =>
            option
              .setName("channel")
              .setDescription("Канал для отправки")
              .setRequired(false)
              .addChannelTypes(ChannelType.GuildText),
          ),
      { idHints: ["1167528847961497610"] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const fileName = interaction.options.getString("id", true);
    const filePath = `./dist/messages/${fileName}.json`;

    const logError = (err: any) => {
      interaction.reply({
        content: `При выполнении команды произошла ошибка:\n\`\`\`${err}\`\`\``,
        ephemeral: true,
      });
      this.container.logger.error("Error reading message:", err);
    };

    readFile(
      filePath,
      "utf-8",
      (err: NodeJS.ErrnoException | null, data: string) => {
        if (err) {
          logError(err);
        } else {
          try {
            const jsonData = JSON.parse(data);
            const channel: TextChannel | null =
              interaction.options.getChannel("channel");
            let attachments = [];

            for (let index = 0; index < jsonData.attachments.length; index++) {
              const fileName = jsonData.attachments[index];
              const path = `./dist/messages/attachments/${fileName}`;
              const file = new AttachmentBuilder(path);
              try {
                attachments.push(file);
              } catch (err) {
                logError(err);
              }
            }

            if (channel) {
              channel.send({
                content: jsonData.content,
                embeds: jsonData.embeds,
                files: attachments,
              });
            } else {
              interaction.channel?.send({
                content: jsonData.content,
                embeds: jsonData.embeds,
                files: attachments,
              });
            }

            interaction.reply({
              content: "Cообщение отправлено.",
              ephemeral: true,
            });
          } catch (jsonErr: any) {
            this.container.logger.error(jsonErr);
          }
        }
      },
    );
  }
}
