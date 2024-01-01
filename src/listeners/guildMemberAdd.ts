import { Listener } from "@sapphire/framework";
import { GuildMember, TextChannel } from "discord.js";
import { t } from "i18next";

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
            `<@&${roleID}> ${t("listeners.guildMemberAdd.welcome_message", {
              member: member.id,
            })}`,
          );
        } else {
          channel.send(
            t("listeners.guildMemberAdd.welcome_message", {
              member: member.id,
            }),
          );
        }
      }

      const memberRoleID = process.env.MEMBER_ROLE_ID;

      if (memberRoleID) {
        const role = member.guild.roles.cache.get(memberRoleID);

        if (role) {
          member.roles.add(
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
