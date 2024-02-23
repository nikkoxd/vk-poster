import { Listener } from "@sapphire/framework";
import { GuildMember, TextChannel } from "discord.js";
import i18next from "i18next";
import Guild from "../schemas/Guild";

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

    const guild = member.guild;
    const guildItem = await Guild.findOne({ id: process.env.GUILD_ID });

    if (!member.guild.features.includes("MEMBER_VERIFICATION_GATE_ENABLED")) {
      let channelID;
      let roleID;
      let memberRoleID;
      if (guildItem) {
        channelID = guildItem.welcome.channelId;
        roleID = guildItem.welcome.roleId;
        memberRoleID = guildItem.memberRoleId;
      } else {
        await Guild.create({ id: process.env.GUILD_ID });
      }

      if (channelID) {
        const channel = this.container.client.channels.cache.get(
          channelID,
        ) as TextChannel;

        if (roleID) {
          channel.send(
            `<@&${roleID}> ${i18next.t(
              "listeners.guildMemberAdd.welcome_message",
              {
                member: member.id,
              },
            )}`,
          );
        } else {
          channel.send(
            i18next.t("listeners.guildMemberAdd.welcome_message", {
              member: member.id,
            }),
          );
        }
      }

      if (memberRoleID) {
        const role = member.guild.roles.cache.get(memberRoleID);

        if (role) {
          member.roles.add(
            role,
            i18next.t("listeners.guildMemberUpdate.member_role.reason"),
          );
        } else {
          this.container.logger.error(
            "Specified member role doesn'i18next.t exist",
          );
        }
      }
    }
  }
}
