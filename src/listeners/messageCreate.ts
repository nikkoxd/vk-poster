import { Listener } from "@sapphire/framework";
import { Message, PermissionFlagsBits } from "discord.js";

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
    if (message.content.includes("@everyone")) {
      if (!message.member?.permissions.has(PermissionFlagsBits.MentionEveryone))
        message.react("🤡");
    }
  }
}
