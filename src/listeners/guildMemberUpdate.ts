import { Listener } from "@sapphire/framework";
import { GuildMember, TextChannel } from "discord.js";
import { t } from "i18next";

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

          // prettier-ignore
          if (roleID) {
            channel.send(
              `<@&${roleID}> ${t("listeners.guildMemberUpdate.welcome_message",
                { member: newMember.id },
              )}`,
            );
          } else {
            channel.send(
              t("listeners.guildMemberUpdate.welcome_message", {
                member: newMember.id,
              }),
            );
          }
        }
      }
    }
  }
}
