import { Listener } from "@sapphire/framework";
import { Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { t } from "i18next";
import Member from "../schemas/Member";

export class messageCreateListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: "messageCreate",
      once: false,
    });
  }

  public override async run(message: Message) {
    // REACT TO @everyone AND @here
    // =============
    const memberId = message.author.id;

    if (!message.author.bot) {
      if ((await Member.find({ id: memberId })).length != 0) {
        message.reply("👋");
      } else {
        const member = new Member({
          id: memberId,
          coins: 0,
        });
        await member.save();
        message.reply(memberId + " добавлен в БД");
      }
    }

    if (
      message.content.includes("@everyone" || "@here") &&
      !message.member?.permissions.has(PermissionFlagsBits.MentionEveryone)
    ) {
      message.react("🤡");
    }
    // REPLY TO FAILED EMBED LINKS
    // =============
    if (
      message.content.startsWith("https://tenor.com/") &&
      !message.member
        ?.permissionsIn(message.channel as TextChannel)
        .has("EmbedLinks")
    ) {
      message.reply(t("listeners.messageCreate.cantSendGifs"));
    }
    // REPLY TO FAILED ATTACHMENTS
    // =============
    // if (
    //   message.attachments &&
    //   !message.content.startsWith("https://tenor.com") &&
    //   !message.member
    //     ?.permissionsIn(message.channel as TextChannel)
    //     .has("AttachFiles")
    // ) {
    //   message.reply(t("listeners.messageCreate.cantAttachFiles"));
    // }
  }
}
