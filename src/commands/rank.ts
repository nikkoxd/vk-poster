import { Command } from "@sapphire/framework";
import { logError } from "..";
import { t } from "i18next";
import Member from "../schemas/Member";
import { Canvas, loadImage } from "@napi-rs/canvas";

import * as fs from "fs";
import * as https from "https";
import { request } from "undici";

import Guild from "../schemas/Guild";
import { AttachmentBuilder } from "discord.js";

export class RankCommand extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("rank")
          .setDescription(t("commands.rank.description"))
          .addUserOption((option) =>
            option
              .setName(t("commands.rank.member.name"))
              .setDescription(t("commands.rank.member.description")),
          ),
      { idHints: [process.env.RANK_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const guildItem = await Guild.findOne({
      id: process.env.GUILD_ID as string,
    });

    const member = interaction.options.getUser(
      t("commands.balance.member.name"),
    );
    const memberId = member ? member.id : interaction.user.id;

    if (guildItem) {
      const canvas = new Canvas(700, 250);
      const context = canvas.getContext("2d");

      const fontFamily = guildItem.card.fontFamily;

      const file = fs.createWriteStream(fontFamily + ".ttf");
      const httpsRequest = https.get(
        "https://github.com/google/fonts/blob/master/ofl/" +
          fontFamily.toLowerCase() +
          "/" +
          fontFamily +
          "-Regular.ttf?raw=true",
        function (response) {
          response.pipe(file);
        },
      );

      const background = await loadImage(guildItem.card.defaultBackground);

      context.drawImage(background, 0, 0, canvas.width, canvas.height);

      context.strokeStyle = "#0099ff";
      context.strokeRect(0, 0, canvas.width, canvas.height);

      context.font = "28px " + fontFamily;
      context.fillStyle = "#ffffff";
      context.fillText(
        interaction.user.displayName,
        canvas.width / 2.5,
        canvas.height / 3.5,
      );

      context.beginPath();
      context.arc(125, 125, 100, 0, Math.PI * 2, true);
      context.closePath();
      context.clip();

      const { body } = await request(
        interaction.user.displayAvatarURL({ extension: "jpg" }),
      );

      const avatar = await loadImage(await body.arrayBuffer());

      context.drawImage(avatar, 25, 25, 200, 200);

      const attachment = new AttachmentBuilder(await canvas.encode("png"), {
        name: "rank-card-image.png",
      });

      interaction.reply({ files: [attachment] });

      try {
        fs.unlinkSync("background.png");
      } catch (err: any) {
        this.container.logger.error(err);
      }
    }

    // try {
    //   const memberItem = await Member.findOneAndUpdate(
    //     { memberId: memberId },
    //     { $setOnInsert: { memberId: memberId } },
    //     { upsert: true, new: true },
    //   );
    //   const required =
    //     100 * (memberItem.level + 1) + Math.pow(memberItem.level, 2) * 50;
    //   interaction.reply(
    //     `**Уровень:** ${memberItem.level}\n**Опыт:** ${memberItem.exp}/${required}`,
    //   );
    // } catch (err: any) {
    //   logError(err, interaction);
    // }
  }
}
