import { Listener } from "@sapphire/framework";
import { Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { t } from "i18next";
import Member from "../schemas/Member";
import { logError } from "..";
import { cooldowns } from "..";
import ms from "ms";

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
      this.container.logger.error(
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
    let delay;
    if (process.env.COINS_COOLDOWN) delay = ms(process.env.COINS_COOLDOWN);
    else delay = 0;

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
