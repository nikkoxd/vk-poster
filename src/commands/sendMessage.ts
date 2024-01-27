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
import Message from "../schemas/Message";

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
    const name = interaction.options.getString(
      t("commands.sendMessage.options.id.name"),
      true,
    );
    const message = await Message.findOne({ name: name });

    if (message) {
      try {
        const channel: TextChannel | null = interaction.options.getChannel(
          t("commands.sendMessage.options.channel.name"),
        );
        let attachments = [];

        if (message.attachments) {
          for (let index = 0; index < message.attachments.length; index++) {
            const fileName = message.attachments[index];
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
            content: message.content,
            embeds: message.embeds,
            files: attachments,
          });
        } else {
          interaction.channel?.send({
            content: message.content,
            embeds: message.embeds,
            files: attachments,
          });
        }

        interaction.reply({
          content: t("commands.sendMessage.success"),
          ephemeral: true,
        });
      } catch (err: any) {
        logError(interaction, err);
      }
    } else {
      logError("Message " + name + " not found");
    }
  }
}
