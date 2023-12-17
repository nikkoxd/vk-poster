import { Listener } from "@sapphire/framework";
import { GuildMember, TextChannel } from "discord.js";

export class guildMemberUpdateListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: "guildMemberUpdate",
      once: false,
    });
  }

  public override async run(oldMember: GuildMember, newMember: GuildMember) {
    this.container.logger.info("MEMBER UPDATED\n=========\n");
    this.container.logger.info("OLD MEMBER: \n=========\n", oldMember);
    this.container.logger.info("NEW MEMBER: \n=========\n", newMember);

    // MEMBER WELCOMING
    // Ran when server has verification gate enabled
    // after member accepts rules
    if (newMember.guild.features.includes("MEMBER_VERIFICATION_GATE_ENABLED")) {
      if (oldMember.pending && !newMember.pending) {
        this.container.logger.info("Member is no longer pending");

        const channelID = process.env.WELCOME_CHANNEL_ID;
        const roleID = process.env.WELCOME_ROLE_ID;

        if (channelID) {
          const channel = this.container.client.channels.cache.get(
            channelID,
          ) as TextChannel;

          if (roleID) {
            channel.send(
              `<@&${roleID}> Приветик, <@${newMember.id}>, приветствуем тебя в нашем кафе!`,
            );
          } else {
            channel.send(
              `Приветик, <@${newMember.id}>, приветствуем тебя в нашем кафе!`,
            );
          }
        }
      }
    }
  }
}
