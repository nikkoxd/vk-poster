import "@sapphire/plugin-logger/register";
import { Command, SapphireClient } from "@sapphire/framework";
import {
  ButtonInteraction,
  Collection,
  GatewayIntentBits,
  StringSelectMenuInteraction,
  TextChannel,
  User,
} from "discord.js";
import { Subcommand } from "@sapphire/plugin-subcommands";

import i18next from "i18next";
import I18NexFsBackend, { FsBackendOptions } from "i18next-fs-backend";

import mongoose from "mongoose";

import { schedule } from "node-cron";

import "dotenv/config";
import Member from "./schemas/Member";
import Guild, { IGuild } from "./schemas/Guild";

// Creating a new instance of the Discord bot client
export const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Error logger with interaction reply
export async function logError(
  err: any,
  interaction:
    | Command.ChatInputCommandInteraction
    | Subcommand.ChatInputCommandInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction,
) {
  interaction.reply({
    content: `${i18next.t("logError")}\n\`\`\`${err}\`\`\``,
    ephemeral: true,
  });
  client.logger.error("Error reading message:", err);
}

let timing = "0 */1 * * *"; // Ran every hour
if (process.env.NODE_ENV == "development") timing = "*/1 * * * *"; // Ran every minute

schedule(timing, async () => {
  try {
    const date = Date.now();
    const memberItems = await Member.find();

    for (const memberItem of memberItems) {
      for (let i = 0; i < memberItem.roles.length; i++) {
        const roleItem = memberItem.roles[i];
        const guild = client.guilds.cache.get(roleItem.guildId);
        if (!guild) return;

        if (date >= roleItem.expiryDate) {
          const role = guild.roles.cache.get(roleItem.roleId);
          const member = guild.members.cache.get(memberItem.memberId);

          const newRoles = memberItem.roles.filter((r, index) => index !== i);

          await memberItem.updateOne({ roles: newRoles });

          if (!role || !member) return;

          await member.roles.remove(role);
        }
      }
      for (let i = 0; i < memberItem.rooms.length; i++) {
        const roomItem = memberItem.rooms[i];
        const guild = client.guilds.cache.get(roomItem.guildId);
        if (!guild) return;

        if (date >= roomItem.expiryDate) {
          const channel = guild.channels.cache.get(roomItem.channelId);

          const newChannels = memberItem.rooms.filter(
            (r, index) => index !== i,
          );

          await memberItem.updateOne({ rooms: newChannels });

          if (!channel) return;

          await channel.delete();
        }
      }
    }
  } catch (error) {
    client.logger.error("Error in role expiry checker:", error);
  }
});

client.logger.info("Running on", process.env.NODE_ENV);

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@database.9jp4vnl.mongodb.net/${process.env.GUILD_ID}?retryWrites=true&w=majority`,
  )
  .then(() => client.logger.info("Connected to MongoDB"))
  .catch((error) => client.logger.error("Error connecting to MongoDB:", error));

// Initializing i18next for internationalization
function i18nConfig(guild: IGuild) {
  i18next.use(I18NexFsBackend).init<FsBackendOptions>(
    {
      lng: guild.language,
      fallbackLng: "en",
      preload: ["en", "ru"],
      ns: ["translation"],
      defaultNS: "translation",
      backend: {
        loadPath: "./locales/{{lng}}/{{ns}}.json",
      },
    },
    (err, t) => {
      if (err) return client.logger.error(err);
      client.logger.info("i18next is ready...");
    },
  );
}

async function runi18n() {
  const guild = await Guild.findOne({ id: process.env.GUILD_ID });
  if (guild) {
    i18nConfig(guild);
  } else {
    const guild = new Guild({ id: process.env.GUILD_ID });
    guild.save();

    i18nConfig(guild);
  }
}

runi18n().then(() => {
  client
    .login(process.env.TOKEN)
    .then(() => client.logger.info("Successfuly connected to Discord API"))
    .catch((error) =>
      client.logger.error("Error connecting to Discord API: ", error),
    );
});
