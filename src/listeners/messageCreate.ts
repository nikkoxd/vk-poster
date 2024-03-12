import { Listener } from "@sapphire/framework";
import {
  Collection,
  Message,
  PermissionFlagsBits,
  TextChannel,
  User,
} from "discord.js";
import i18next from "i18next";
import Member, { IMember } from "../schemas/Member";
import ms from "ms";
import Guild, { IGuild } from "../schemas/Guild";
import RoleReward from "../schemas/RoleReward";
import { Document } from "mongoose";

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

  // TODO: Remove member and guild checking from all of the methods

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

  private async processRoles(message: Message, member: IMember) {
    const level = member.level;
    const roles = await RoleReward.find();
    try {
      if (roles && message.member) {
        let roleReward = await RoleReward.findOne({
          level: level,
        });
        if (roleReward) {
          roles.forEach((role) => {
            if (message.member!.roles.cache.has(role.id))
              message.member!.roles.remove(role.id);
          });
          message.member!.roles.add(roleReward!.id);
        }
      }
    } catch (err: any) {
      this.container.logger.error(err);
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

      const newMember = await Member.findOne({ memberId: member.memberId });
      this.processRoles(message, newMember!);
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
      message.reply(i18next.t("listeners.messageCreate.cantSendGifs"));
    }
    // REPLY TO FAILED ATTACHMENTS
    // if (
    //   message.attachments &&
    //   !message.content.startsWith("https://tenor.com") &&
    //   !message.member
    //     ?.permissionsIn(message.channel as TextChannel)
    //     .has("AttachFiles")
    // ) {
    //   message.reply(i18next.t("listeners.messageCreate.cantAttachFiles"));
    // }
  }

  private async processCommands(
    message: Message,
    guild: IGuild,
    member: Document<any, any, IMember> & IMember,
  ) {
    if (guild.coins.bumpReward == 0) return;

    const interaction = message.interaction;

    if (!interaction) return;
    if (
      interaction.commandName == "like" ||
      interaction.commandName == "up" ||
      interaction.commandName == "bump"
    ) {
      this.container.logger.info(interaction);
    }
    if (
      interaction.commandName != "like" &&
      interaction.commandName != "up"
      // && interaction.commandName != "bump"
    )
      return;

    this.container.logger.info(`Got a ${interaction.commandName} command`);

    if (!this.container.scheduler.isOnCooldown(interaction.commandName)) {
      this.container.logger.info(
        `${interaction.commandName} is not on cooldown`,
      );
      this.container.scheduler.addCooldown(interaction.commandName, ms("4h"));

      await member.updateOne({
        coins: member.coins + guild.coins.bumpReward,
      });

      this.container.logger.info(
        `Gave ${guild.coins.bumpReward} coins to member with id ${member.id}`,
      );

      message.reply(
        i18next.t("listeners.messageCreate.bumpRewarded", {
          memberId: interaction.user.id,
          coins: guild.coins.bumpReward,
        }),
      );
    }
  }

  public override async run(message: Message) {
    const guild = await Guild.findOne({ id: process.env.GUILD_ID });
    if (!guild) return;

    if (!message.author.bot) {
      const member = await Member.findOne({ memberId: message.author.id });

      await this.giveCoins(message, guild, member);
      await this.giveExp(message, guild, member);

      this.processPings(message);
      this.processLinks(message);
    } else {
      if (!message.interaction) return;

      const member = await Member.findOne({
        memberId: message.interaction.user.id,
      });
      if (!member) return;

      await this.processCommands(message, guild, member);
    }
  }
}
