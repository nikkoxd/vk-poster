import "@sapphire/plugin-logger/register";
import { Command, SapphireClient } from "@sapphire/framework";
import { Collection, GatewayIntentBits, TextChannel, User } from "discord.js";
import { Subcommand } from "@sapphire/plugin-subcommands";

import i18next from "i18next";
import I18NexFsBackend, { FsBackendOptions } from "i18next-fs-backend";

import mongoose from "mongoose";

import { schedule } from "node-cron";

import "dotenv/config";
import Member from "./schemas/Member";

// Creating a new instance of the Discord bot client
export const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

// Initializing i18next for internationalization
i18next.use(I18NexFsBackend).init<FsBackendOptions>(
  {
    lng: process.env.LANGUAGE,
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

// Error logger with interaction reply
export async function logError(
  err: any,
  interaction:
    | Command.ChatInputCommandInteraction
    | Subcommand.ChatInputCommandInteraction,
) {
  interaction.reply({
    content: `${i18next.t("logError")}\n\`\`\`${err}\`\`\``,
    ephemeral: true,
  });
  client.logger.error("Error reading message:", err);
}

export let cooldowns = new Collection<User, number>();

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

        // Check if current date is after the role expiry date
        if (guild && date >= roleItem.expiryDate) {
          const role = guild.roles.cache.get(roleItem.roleId);
          const member = guild.members.cache.get(memberItem.memberId);

          if (role && member) {
            // Create a new array without the expired role
            const newRoles = memberItem.roles.filter((r, index) => index !== i);

            // Remove the role from the member
            await member.roles.remove(role);

            // Update the Member document with the new roles array
            await memberItem.updateOne({ roles: newRoles });
          }
        }
      }
    }
  } catch (error) {
    client.logger.error("Error in role expiry checker:", error);
  }
});

client.logger.info("Running on", process.env.NODE_ENV);

mongoose
  .connect(process.env.DB_URI as string)
  .then(() => client.logger.info("Connected to MongoDB"))
  .catch((error) => client.logger.error("Error connecting to MongoDB:", error));

client
  .login(process.env.TOKEN)
  .then(() => client.logger.info("Successfuly connected to Discord API"))
  .catch((error) =>
    client.logger.error("Error connecting to Discord API: ", error),
  );
