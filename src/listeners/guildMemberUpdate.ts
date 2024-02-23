import { Listener } from "@sapphire/framework";
import { GuildMember, TextChannel } from "discord.js";
import i18next from "i18next";
import Guild from "../schemas/Guild";

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
    const guild = newMember.guild;
    const guildItem = await Guild.findOne({ id: process.env.GUILD_ID });

    if (
      guild.features.includes("MEMBER_VERIFICATION_GATE_ENABLED") &&
      oldMember.pending &&
      !newMember.pending
    ) {
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
        const channel = guild.channels.cache.get(channelID) as TextChannel;

        const welcomeMessage = roleID
          ? `<@&${roleID}> ${i18next.t(
              "listeners.guildMemberUpdate.welcome_message",
              {
                member: newMember.id,
              },
            )}`
          : i18next.t("listeners.guildMemberUpdate.welcome_message", {
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
              i18next.t("listeners.guildMemberUpdate.member_role.reason"),
            );
          } catch (error) {
            console.error("Error adding role to the member:", error);
          }
        } else {
          console.error("Specified member role doesn'i18next.t exist");
        }
      }
    }
  }
}
