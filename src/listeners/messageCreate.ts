import { Listener } from "@sapphire/framework";
import { Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { t } from "i18next";
import Member from "../schemas/Member";
import { logError } from "..";
import { cooldowns } from "..";
import ms from "ms";
import Guild, { IGuild } from "../schemas/Guild";

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

  async getRandomCoins(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  public override async run(message: Message) {
    const memberId = message.author.id;
    const member = await Member.findOne({ memberId: memberId });

    const guild = await Guild.findOne({ id: process.env.GUILD_ID });
    let cooldown, min, max;
    if (guild) {
      cooldown = ms(guild.coins.cooldown);
      min = guild.coins.min;
      max = guild.coins.max;
    } else {
      const guild = new Guild({ id: process.env.GUILD_ID });
      guild.save();
      cooldown = ms(guild.coins.cooldown);
      min = guild.coins.min;
      max = guild.coins.max;
    }

    if (!cooldowns.has(message.author)) {
      cooldowns.set(message.author, 0);
    }
    const now = Date.now();

    if (message.content.includes("@everyone" || "@here")) {
      if (!message.member?.permissions.has(PermissionFlagsBits.MentionEveryone))
        message.react("🤡");
    }

    if (!message.author.bot) {
      if ((cooldowns.get(message.author) as number) >= now - cooldown) return;
      cooldowns.set(message.author, now);

      const addedCoins = await this.getRandomCoins(min, max);
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
