import { Listener } from "@sapphire/framework";
import { logError } from "..";
import i18next from "i18next";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ChannelType,
  EmbedBuilder,
  GuildChannelManager,
  GuildMember,
  PermissionFlagsBits,
  VoiceChannel,
  VoiceState,
} from "discord.js";
import Guild from "../schemas/Guild";

export class VoiceStateUpdateListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: "voiceStateUpdate",
      once: false,
    });
  }

  public override async run(oldMember: VoiceState, newMember: VoiceState) {
    const guildConfig = await Guild.findOne({ id: process.env.GUILD_ID });
    if (!guildConfig) return;

    // Create a new channel if joined manager vc
    if (newMember.channelId == guildConfig.rooms.manager) {
      if (!guildConfig.rooms.category) return;

      const newChannel = await newMember.guild.channels.create({
        name: guildConfig.rooms.name,
        parent: guildConfig.rooms.category,
        type: ChannelType.GuildVoice,
        permissionOverwrites: [
          {
            id: newMember.id,
            allow: [
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.ManageChannels,
            ],
          },
        ],
      });

      const optionsEmbed = new EmbedBuilder()
        .setTitle(i18next.t("listeners.voiceStateUpdate.embed.title"))
        .setColor(`#${guildConfig.embedColor}`)
        .setDescription(
          i18next.t("listeners.voiceStateUpdate.embed.description"),
        );

      const optionsRow = new ActionRowBuilder<ButtonBuilder>().addComponents([
        new ButtonBuilder()
          .setCustomId("rooms-lock")
          .setLabel("🔒")
          .setStyle(3),
        new ButtonBuilder()
          .setCustomId("rooms-unlock")
          .setLabel("🔓")
          .setStyle(3),
        new ButtonBuilder()
          .setCustomId("rooms-newmod")
          .setLabel("🔧")
          .setStyle(3),
      ]);

      newChannel.send({ embeds: [optionsEmbed], components: [optionsRow] });

      setTimeout(async () => {
        if (newMember.channelId == guildConfig.rooms.manager) {
          newMember.setChannel(newChannel);
        } else {
          newChannel.delete();
        }
      }, 500);
    }

    if (!oldMember.channel) return;
    if (!oldMember.channel.parent) return;

    // Delete the old channel if it's in room category
    if (
      oldMember.channelId != guildConfig.rooms.manager &&
      oldMember.channel.parent.id == guildConfig.rooms.category &&
      oldMember.channel.members.size == 0
    ) {
      await oldMember.channel!.delete();
    }
  }
}
