import { Subcommand } from "@sapphire/plugin-subcommands";
import { ChannelType, Message, PermissionFlagsBits } from "discord.js";
import { logError } from "..";
import { t } from "i18next";

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
          .setDescription(t("commands.poll.description"))
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents)
          .addSubcommand((command) =>
            command
              .setName("start")
              .setDescription(t("commands.poll.start.description"))
              .addStringOption((option) =>
                option
                  .setName(t("commands.poll.start.options.text.name"))
                  .setDescription(
                    t("commands.poll.start.options.text.description"),
                  )
                  .setRequired(true),
              )
              .addChannelOption((option) =>
                option
                  .setName(t("commands.poll.start.options.channel.name"))
                  .setDescription(
                    t("commands.poll.start.options.channel.description"),
                  )
                  .setRequired(false),
              ),
          )
          .addSubcommand((command) =>
            command
              .setName("edit")
              .setDescription(t("commands.poll.edit.description"))
              .addStringOption((option) =>
                option
                  .setName(t("commands.poll.edit.options.id.name"))
                  .setDescription(
                    t("commands.poll.edit.options.id.description"),
                  )
                  .setRequired(true),
              )
              .addStringOption((option) =>
                option
                  .setName(t("commands.poll.edit.options.text.name"))
                  .setDescription(
                    t("commands.poll.edit.options.text.description"),
                  )
                  .setRequired(true),
              ),
          )
          .addSubcommand((command) =>
            command
              .setName("end")
              .setDescription(t("commands.poll.end.description"))
              .addStringOption((option) =>
                option
                  .setName(t("commands.poll.end.options.id.name"))
                  .setDescription(t("commands.poll.end.options.id.description"))
                  .setRequired(true),
              ),
          ),
      { idHints: [process.env.POLL_ID as string] },
    );
  }

  public async chatInputStart(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const text = interaction.options.getString(
      t("commands.poll.start.options.text.name"),
      true,
    );
    const channel = interaction.options.getChannel(
      t("commands.poll.start.options.channel.name"),
      false,
      [ChannelType.GuildText],
    );

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

        // prettier-ignore
        interaction.reply({
          content: `${t("commands.poll.success")}\n${t("commands.poll.link",)} <#${channel.id}>`,
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
          content: t("commands.poll.success"),
          ephemeral: true,
        });
      }
    } catch (err) {
      logError(interaction, err);
    }
  }

  public async chatInputEdit(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const messageID = interaction.options.getString(
      t("commands.poll.edit.options.id.name"),
      true,
    );
    const message = interaction.channel?.messages.fetch(messageID);
    const text = interaction.options.getString(
      t("commands.poll.edit.options.text.name"),
      true,
    );

    try {
      (await message)?.edit(text);
      interaction.reply({
        content: t("commands.poll.edited"),
        ephemeral: true,
      });
    } catch (err) {
      logError(interaction, err);
    }
  }

  public async chatInputEnd(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const messageID = interaction.options.getString(
      t("commands.poll.end.options.id.name"),
      true,
    );
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
          `**🎉 ${t("commands.poll.ended")}**\n> ${text}\n${t("poll.for")} - ${
            (reactionsYes as number) - 1
          }   ${t("poll.against")} - ${(reactionsNo as number) - 1}`,
        );
        // Remove all reactions
        (await message)?.reactions.removeAll();
        interaction.reply({
          content: t("commands.poll.ended"),
          ephemeral: true,
        });
      } else {
        throw new Error(
          "Message is either not a poll or the poll has already ended",
        );
      }
    } catch (err) {
      logError(interaction, err);
    }
  }
}
