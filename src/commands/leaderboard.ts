import { Subcommand } from "@sapphire/plugin-subcommands";
import { logError } from "..";
import i18next from "i18next";
import Member, { IMember } from "../schemas/Member";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ComponentType,
  EmbedBuilder,
} from "discord.js";
import Guild from "../schemas/Guild";

export class LeaderboardCommand extends Subcommand {
  public constructor(
    ctx: Subcommand.LoaderContext,
    options: Subcommand.Options,
  ) {
    super(ctx, {
      ...options,
      name: "leaderboard",
      subcommands: [
        {
          name: "coins",
          chatInputRun: "chatInputCoins",
        },
        {
          name: "exp",
          chatInputRun: "chatInputExp",
        },
      ],
    });
  }

  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("leaderboard")
          .setDescription(i18next.t("commands.leaderboard.description"))
          .addSubcommand((command) =>
            command
              .setName("coins")
              .setDescription(
                i18next.t("commands.leaderboard.coins.description"),
              ),
          )
          .addSubcommand((command) =>
            command
              .setName("exp")
              .setDescription(
                i18next.t("commands.leaderboard.exp.description"),
              ),
          ),
      { idHints: [process.env.LEADERBOARD_ID as string] },
    );
  }

  public async createCoinsPageEmbed(
    page: number,
    itemsPerPage: number,
    members: IMember[],
  ): Promise<EmbedBuilder> {
    const guild = await Guild.findOne({ id: process.env.GUILD_ID });

    const totalPages = Math.ceil(members.length / itemsPerPage);

    const startIdx = (page - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;

    const embed = new EmbedBuilder()
      .setTitle(i18next.t("leaderboard.title"))
      .setColor(`#${guild!.embedColor}`)
      .setFooter({ text: `Страница: ${page}/${totalPages}` });

    const paginatedMembers = members.slice(startIdx, endIdx);

    let description = "";

    for (let i = 0; i < paginatedMembers.length; i++) {
      const member = paginatedMembers[i];
      description += `${i * 10 + i + 1}. <@${member.memberId}>: ${
        member.coins
      } монеток\n`;
    }

    embed.setDescription(description);
    return embed;
  }

  public async createExpPageEmbed(
    page: number,
    itemsPerPage: number,
    members: IMember[],
  ): Promise<EmbedBuilder> {
    const guild = await Guild.findOne({ id: process.env.GUILD_ID });

    const totalPages = Math.ceil(members.length / itemsPerPage);

    const startIdx = (page - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;

    const embed = new EmbedBuilder()
      .setTitle(i18next.t("leaderboard.title"))
      .setColor(`#${guild!.embedColor}`)
      .setFooter({ text: `Страница: ${page}/${totalPages}` });

    const paginatedMembers = members.slice(startIdx, endIdx);

    let description = "";

    for (let i = 0; i < paginatedMembers.length; i++) {
      const member = paginatedMembers[i];
      description += `${i * 10 + i + 1}. <@${member.memberId}>: ${
        member.level
      } уровень (${member.exp} опыта)\n`;
    }

    embed.setDescription(description);
    return embed;
  }

  public async chatInputCoins(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const reply = await interaction.deferReply({ fetchReply: true });

    const members = await Member.find().sort({ coins: -1 });
    const itemsPerPage = 10;
    const totalPages = Math.ceil(members.length / itemsPerPage);

    let page = 1;

    const embed = await this.createCoinsPageEmbed(page, itemsPerPage, members);

    if (totalPages > 1) {
      const buttonRow = new ActionRowBuilder<ButtonBuilder>();
      buttonRow.addComponents(
        new ButtonBuilder().setCustomId("prev-page").setLabel("<").setStyle(3),
        new ButtonBuilder().setCustomId("next-page").setLabel(">").setStyle(3),
      );

      await interaction.editReply({ embeds: [embed], components: [buttonRow] });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60_000,
      });

      collector.on("collect", async (collectedInteraction) => {
        if (collectedInteraction.customId == "prev-page" && page != 1) page--;
        if (collectedInteraction.customId == "next-page" && page != totalPages)
          page++;

        const embed = await this.createCoinsPageEmbed(
          page,
          itemsPerPage,
          members,
        );

        await collectedInteraction.update({ embeds: [embed] });
      });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
  }

  public async chatInputExp(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const reply = await interaction.deferReply({ fetchReply: true });

    const members = await Member.find().sort({ exp: -1 });
    const itemsPerPage = 10;
    const totalPages = Math.ceil(members.length / itemsPerPage);

    let page = 1;

    const embed = await this.createExpPageEmbed(page, itemsPerPage, members);

    if (totalPages > 1) {
      const buttonRow = new ActionRowBuilder<ButtonBuilder>();
      buttonRow.addComponents(
        new ButtonBuilder().setCustomId("prev-page").setLabel("<").setStyle(3),
        new ButtonBuilder().setCustomId("next-page").setLabel(">").setStyle(3),
      );

      await interaction.editReply({ embeds: [embed], components: [buttonRow] });

      const collector = reply.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60_000,
      });

      collector.on("collect", async (collectedInteraction) => {
        if (collectedInteraction.customId == "prev-page" && page != 1) page--;
        if (collectedInteraction.customId == "next-page" && page != totalPages)
          page++;

        const embed = await this.createExpPageEmbed(
          page,
          itemsPerPage,
          members,
        );

        await collectedInteraction.update({ embeds: [embed] });
      });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }
  }
}
