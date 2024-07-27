import { Express, Request, Response } from "express";
import Message from "../types/message";
import { EmbedBuilder, EmbedData, TextChannel } from "discord.js";
import { client } from "..";

module.exports = function(app: Express) {
  app.post("/api/message", async (req: Request, res: Response) => {
    const data: Message = req.body;

    const channelId = data.channelId;
    const message = data.message;

    let embeds: Array<EmbedBuilder> = [];

    if (data.embeds) {
      data.embeds.forEach(embed => {
        let embedData: EmbedData = {};

        if (embed.author.name) {
          embedData.author = {
            name: embed.author.name,
            url: embed.author.url,
            iconURL: embed.author.icon_url,
          };
        }
        if (embed.body.color) embedData.color = parseInt(embed.body.color.slice(1), 16);
        if (embed.body.description) embedData.description = embed.body.description;
        if (embed.fields) embedData.fields = embed.fields;
        if (embed.footer.text) {
          embedData.footer = {
            text: embed.footer.text,
            iconURL: embed.footer.icon_url,
          };
        }
        if (embed.images.image_url) embedData.image = { url: embed.images.image_url };
        if (embed.images.thumbnail_url) embedData.thumbnail = { url: embed.images.thumbnail_url };
        if (embed.footer.timestamp) embedData.timestamp = new Date(embed.footer.timestamp).getTime();
        if (embed.body.title) embedData.title = embed.body.title;
        if (embed.body.url) embedData.url = embed.body.url;

        embeds.push(new EmbedBuilder(embedData));
      });
    }

    const attachments = data.attachments;

    const guild = await client.guilds.fetch(process.env.GUILD_ID!);

    if (!guild) {
      res.send("Guild ID not set in bot's environment variables");
      return;
    }

    const channel = await guild.channels.fetch(channelId);

    if (!channel) {
      res.send("Channel with given ID not found");
      return;
    }

    if (channel instanceof TextChannel) {
      channel.send({ content: message, embeds: embeds, files: attachments });
    }
    else {
      res.send("Given channel is not a text channel");
      return;
    }
    res.send("Message sent!");
  });
}
