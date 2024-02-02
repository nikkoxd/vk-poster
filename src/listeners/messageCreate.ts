import { Listener } from "@sapphire/framework";
import {
  Collection,
  Message,
  PermissionFlagsBits,
  TextChannel,
  User,
} from "discord.js";
import { t } from "i18next";
import Member, { IMember } from "../schemas/Member";
import { logError } from "..";
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

  coinCooldowns = new Collection<User, number>();
  expCooldowns = new Collection<User, number>();

  private getRandomInt(min: number, max: number) {
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

    if (!this.coinCooldowns.has(message.author)) {
      this.coinCooldowns.set(message.author, 0);
    }
    const now = Date.now();

    if (!message.author.bot) {
      if ((this.coinCooldowns.get(message.author) as number) >= now - cooldown)
        return;
      this.coinCooldowns.set(message.author, now);

      const addedCoins = this.getRandomInt(min, max);
      if (member) {
        await Member.updateOne(
          {
            memberId: memberId,
          },
          {
            coins: member.coins + addedCoins,
          },
        );
      } else {
        await Member.create({ memberId: memberId, coins: addedCoins });
      }
    }
  }

  private async processExp(
    message: Message,
    member: IMember,
    addedExp: number,
  ) {
    const totalExp = member.exp + addedExp;
    let level;
    if (member.level) level = member.level;
    else {
      await Member.updateOne({ memberId: message.author.id }, { level: 0 });
      level = 0;
    }
    const reqExp = 100 * (level + 1) + Math.pow(level, 2) * 50;
    if (totalExp > reqExp) {
      await Member.updateOne(
        { memberId: message.author.id },
        { level: level + 1 },
      );
      message.channel.send(
        `<@${message.author.id}> достиг ${level + 1} уровня!`,
      );
    }
  }

  private async giveExp(
    message: Message,
    guild: IGuild | null,
    member: IMember | null,
  ) {
    const memberId = message.author.id;
    let cooldown, min, max;
    if (guild) {
      cooldown = ms(guild.exp.cooldown);
      min = guild.exp.min;
      max = guild.exp.max;
    } else {
      const guild = new Guild({ id: process.env.GUILD_ID });
      guild.save();
      cooldown = ms(guild.exp.cooldown);
      min = guild.exp.min;
      max = guild.exp.max;
    }

    if (!this.expCooldowns.has(message.author)) {
      this.expCooldowns.set(message.author, 0);
    }
    const now = Date.now();
    if (!message.author.bot) {
      if ((this.expCooldowns.get(message.author) as number) >= now - cooldown)
        return;
      this.expCooldowns.set(message.author, now);

      const addedExp = this.getRandomInt(min, max);
      if (member) {
        await Member.updateOne(
          {
            memberId: memberId,
          },
          {
            exp: member.exp + addedExp,
          },
        );
        await this.processExp(message, member, addedExp);
      } else {
        const member = new Member({ memberId: memberId, exp: addedExp });
        await this.processExp(message, member, addedExp);
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
    await this.giveExp(message, guild, member);

    this.processPings(message);
    this.processLinks(message);
  }
}
