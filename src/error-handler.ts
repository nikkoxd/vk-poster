import { RepliableInteraction } from "discord.js";
import i18next from "i18next";
import { client } from ".";

export class ErrorHandler {
  public async logAndReply(error: Error, interaction: RepliableInteraction) {
    interaction.reply({
      content: i18next.t("handlers.log", { error: error }),
      ephemeral: true,
    });
    client.logger.error("Error reading message:", error);
  }
}
