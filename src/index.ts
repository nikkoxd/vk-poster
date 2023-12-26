import "@sapphire/plugin-logger/register";
import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";

import { MongoClient, ServerApiVersion } from "mongodb";

import i18next from "i18next";
import I18NexFsBackend, { FsBackendOptions } from "i18next-fs-backend";

import "dotenv/config";

// Creating a new instance of the MongoDB client
const mongoClient = new MongoClient(process.env.MONGODB_URI as string, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Creating a new instance of the Discord bot client
const discordClient = new SapphireClient({
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
    if (err) return discordClient.logger.error(err);
    discordClient.logger.info("i18next is ready...");
  },
);

async function run() {
  try {
    discordClient.logger.info("Running on", process.env.NODE_ENV);
    // MONGODB CONNECTION
    // Connect the client to the server
    await mongoClient.connect();
    // Send a ping to confirm a successful connection
    await mongoClient.db("admin").command({ ping: 1 });
    discordClient.logger.info("Successfuly connected to MongoDB");
    // DISCORD API CONNECTION
    // Connect the client to Discord API
    discordClient.login(process.env.TOKEN);
    discordClient.logger.info("Successfuly connected to Discord API");
  } finally {
    // Ensures that the client will close when the program finishes/errors
    await mongoClient.close();
  }
}

run().catch(discordClient.logger.error);
