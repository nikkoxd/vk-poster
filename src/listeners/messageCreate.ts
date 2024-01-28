import { Listener } from "@sapphire/framework";
import { Message, PermissionFlagsBits } from "discord.js";
import Member from "../schemas/Member";
import { logError } from "..";
import { cooldowns } from "..";

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

  async getRandomCoins() {
    const min = Number(process.env.COINS_MIN);
    const max = Number(process.env.COINS_MAX);
    if (min && max) {
      return Math.floor(Math.random() * (max - min) + min);
    } else {
      logError(
        "MIN and MAX values for coins not found, giving predefined amount",
      );
      return Math.floor(Math.random() * (85 - 50) + 50);
    }
  }

  public override async run(message: Message) {
    const memberId = message.author.id;
    const member = await Member.findOne({ memberId: memberId });

    if (!cooldowns.has(message.author)) {
      cooldowns.set(message.author, 0);
    }
    const now = Date.now();
    const delay = Number(process.env.COINS_COOLDOWN);

    if (message.content.includes("@everyone" || "@here")) {
      if (!message.member?.permissions.has(PermissionFlagsBits.MentionEveryone))
        message.react("🤡");
    }

    if (!message.author.bot) {
      if ((cooldowns.get(message.author) as number) >= now - delay) return;
      cooldowns.set(message.author, now);

      const addedCoins = await this.getRandomCoins();
      if (member) {
        await Member.updateOne(
          { memberId: memberId },
          { coins: member.coins + addedCoins },
        );
      } else {
        await Member.create({ memberId: memberId, coins: addedCoins });
      }
    }
  }
}
