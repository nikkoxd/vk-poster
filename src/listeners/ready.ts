import { Listener } from "@sapphire/framework";
import { ActivityType, Client } from "discord.js";

export class readyListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: "ready",
      once: true,
    });
  }

  public override async run(client: Client) {
    try {
      if (process.env.CUSTOM_STATUS) {
        this.container.client.user?.setActivity(process.env.CUSTOM_STATUS, {
          type: ActivityType.Custom,
        });
      } else {
        this.container.client.user?.setActivity("✨ discord.gg/starrysky", {
          type: ActivityType.Custom,
        });
      }
    } catch (err) {
      this.container.logger.error(
        "Error while trying to set the bot's status:",
        err,
      );
    }
  }
}
