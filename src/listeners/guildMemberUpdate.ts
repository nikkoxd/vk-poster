import { Listener } from "@sapphire/framework";
import { GuildMember, TextChannel } from "discord.js";
import { t } from "i18next";

export class GuildMemberUpdateListener extends Listener {
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
        const channel = guild.channels.cache.get(channelID) as TextChannel;

        const welcomeMessage = welcomeRoleID
          ? `<@&${welcomeRoleID}> ${t(
              "listeners.guildMemberUpdate.welcome_message",
              { member: newMember.id },
            )}`
          : t("listeners.guildMemberUpdate.welcome_message", {
              member: newMember.id,
            });

        channel.send(welcomeMessage);
      }

      if (memberRoleID) {
        const role = guild.roles.cache.get(memberRoleID);

        if (role) {
          try {
            await newMember.roles.add(
              role,
              t("listeners.guildMemberUpdate.member_role.reason"),
            );
          } catch (error) {
            console.error("Error adding role to the member:", error);
          }
        } else {
          console.error("Specified member role doesn't exist");
        }
      }
    }
  }
}
