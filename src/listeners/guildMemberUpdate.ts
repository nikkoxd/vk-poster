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
    this.container.logger.info("MEMBER UPDATED\n=========\n");
    this.container.logger.info("OLD MEMBER: \n=========\n", oldMember);
    this.container.logger.info("NEW MEMBER: \n=========\n", newMember);

    // MEMBER WELCOMING
    // Ran when server has verification gate enabled
    // after member accepts rules
    if (newMember.guild.features.includes("MEMBER_VERIFICATION_GATE_ENABLED")) {
      if (oldMember.pending && !newMember.pending) {
        // Ping member and the welcoming role in a text channel
        const channelID = process.env.WELCOME_CHANNEL_ID;
        const welcomeRoleID = process.env.WELCOME_ROLE_ID;

        if (channelID) {
          const channel = newMember.guild.channels.cache.get(
            channelID,
          ) as TextChannel;

          // prettier-ignore
          if (welcomeRoleID) {
            channel.send(
              `<@&${welcomeRoleID}> ${t("listeners.guildMemberUpdate.welcome_message",
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
        // Give a role to the member
        const memberRoleID = process.env.MEMBER_ROLE_ID;

        if (memberRoleID) {
          const role = newMember.guild.roles.cache.get(memberRoleID);

          if (role) {
            newMember.roles.add(
              role,
              t("listeners.guildMemberUpdate.member_role.reason"),
            );
          } else {
            this.container.logger.error("Specified member role doesn't exist");
          }
        }
      }
    }
  }
}
