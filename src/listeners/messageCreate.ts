import { Listener } from "@sapphire/framework";
import { Message, PermissionFlagsBits } from "discord.js";
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

    if (message.content.includes("@everyone" || "@here")) {
      if (!message.member?.permissions.has(PermissionFlagsBits.MentionEveryone))
        message.react("🤡");
    }
  }
}
