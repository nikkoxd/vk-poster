import { Listener } from "@sapphire/framework";
import { Message, PermissionFlagsBits, TextChannel } from "discord.js";
import { t } from "i18next";
import Member, { IMember } from "../schemas/Member";
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

  private getRandomCoins(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  private processPings(message: Message) {
    if (message.content.includes("@everyone" || "@here")) {
      if (!message.member?.permissions.has(PermissionFlagsBits.MentionEveryone))
        message.react("🤡");
    }
  }

  private async giveCoins(
    message: Message,
    guild: IGuild | null,
    member: IMember | null,
  ) {
    const memberId = message.author.id;
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
  }

  private processLinks(message: Message) {
    // REPLY TO FAILED EMBED LINKS
    if (
      message.content.startsWith("https://tenor.com/") &&
      !message.member
        ?.permissionsIn(message.channel as TextChannel)
        .has("EmbedLinks")
    ) {
      message.reply(t("listeners.messageCreate.cantSendGifs"));
    }
    // REPLY TO FAILED ATTACHMENTS
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

  public override async run(message: Message) {
    const member = await Member.findOne({ memberId: message.author.id });
    const guild = await Guild.findOne({ id: process.env.GUILD_ID });

    await this.giveCoins(message, guild, member);

    this.processPings(message);

    this.processLinks(message);
  }
}
