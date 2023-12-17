import { Listener } from "@sapphire/framework";
import { GuildMember, TextChannel } from "discord.js";

export class GuildMemberAvailableListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: "guildMemberAdd",
      once: false,
    });
  }

  public override async run(member: GuildMember) {
    this.container.logger.info("User", member.id, "joined the guild!");

    if (!member.guild.features.includes("MEMBER_VERIFICATION_GATE_ENABLED")) {
      const channelID = process.env.WELCOME_CHANNEL_ID;
      const roleID = process.env.WELCOME_ROLE_ID;

      if (channelID) {
        const channel = this.container.client.channels.cache.get(
          channelID,
        ) as TextChannel;

        if (roleID) {
          channel.send(
            `<@&${roleID}> Приветик, <@${member.id}>, приветствуем тебя в нашем кафе!`,
          );
        } else {
          channel.send(
            `Приветик, <@${member.id}>, приветствуем тебя в нашем кафе!`,
          );
        }
      }
    }
  }
}
