import { Command } from "@sapphire/framework";
import {
  AttachmentBuilder,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { logError } from "..";
import { readFile } from "fs";
import { t } from "i18next";

export class SendMessageCommand extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("sendmsg")
          .setDescription(t("commands.sendMessage.description"))
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
          .addStringOption((option) =>
            option
              .setName(t("commands.sendMessage.options.id.name"))
              .setDescription(t("commands.sendMessage.options.id.description"))
              .setRequired(true),
          )
          .addChannelOption((option) =>
            option
              .setName(t("commands.sendMessage.options.channel.name"))
              .setDescription(
                t("commands.sendMessage.options.channel.description"),
              )
              .setRequired(false)
              .addChannelTypes(ChannelType.GuildText),
          ),
      { idHints: [process.env.SENDMSG_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const fileName = interaction.options.getString(
      t("commands.sendMessage.options.id.name"),
      true,
    );
    const filePath = `./dist/messages/${fileName}.json`;

    readFile(
      filePath,
      "utf-8",
      (err: NodeJS.ErrnoException | null, data: string) => {
        if (err) {
          logError(err, interaction);
        } else {
          try {
            const jsonData = JSON.parse(data);
            const channel: TextChannel | null = interaction.options.getChannel(
              t("commands.sendMessage.options.channel.name"),
            );
            let attachments = [];

            if (jsonData.attachments) {
              for (
                let index = 0;
                index < jsonData.attachments.length;
                index++
              ) {
                const fileName = jsonData.attachments[index];
                const path = `./dist/messages/attachments/${fileName}`;
                const file = new AttachmentBuilder(path);
                try {
                  attachments.push(file);
                } catch (err) {
                  logError(err, interaction);
                }
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
              content: t("commands.sendMessage.success"),
              ephemeral: true,
            });
          } catch (jsonErr: any) {
            logError(interaction, jsonErr);
          }
        }
      },
    );
  }
}
