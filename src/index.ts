import "@sapphire/plugin-logger/register";
import { Command, SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";

import * as mongoDB from "mongodb";

import i18next from "i18next";
import I18NexFsBackend, { FsBackendOptions } from "i18next-fs-backend";

import "dotenv/config";
import { Subcommand } from "@sapphire/plugin-subcommands";

// Creating a new instance of the Discord bot client
const client = new SapphireClient({
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

export async function logError(
  interaction:
    | Command.ChatInputCommandInteraction
    | Subcommand.ChatInputCommandInteraction,
  err: any,
) {
  interaction.reply({
    content: `${i18next.t("logError")}\n\`\`\`${err}\`\`\``,
    ephemeral: true,
  });
  client.logger.error("Error reading message:", err);
}

export async function connectToDatabase() {
  const dbclient: mongoDB.MongoClient = new mongoDB.MongoClient(
    process.env.DB_URI as string,
  );

  await dbclient.connect();

  const database: mongoDB.Db = dbclient.db(process.env.DB_NAME);

  client.logger.info(`Successfully connected to database: ${db.databaseName}`);
}

client.logger.info("Running on", process.env.NODE_ENV);

client.login(process.env.TOKEN);
client.logger.info("Successfuly connected to Discord API");
