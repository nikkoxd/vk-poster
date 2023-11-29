import "@sapphire/plugin-logger/register";
import { SapphireClient } from "@sapphire/framework";
import { ActivityType, GatewayIntentBits } from "discord.js";

import "dotenv/config";

const client = new SapphireClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.logger.info("Running on", process.env.NODE_ENV);
client.login(process.env.TOKEN);
