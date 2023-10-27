import { Listener } from "@sapphire/framework";
import { ActivityType, Client } from "discord.js";

export class readyListener extends Listener {
  public constructor(context: Listener.Context, options: Listener.Options) {
    super(context, {
      ...options,
      event: 'ready',
      once: true
    });
  }

  public override async run(client: Client) {
    try {
      this.container.client.user?.setActivity('https://discord.gg/starrysky', { type: ActivityType.Watching });
    } catch (err) {
      this.container.logger.error("Error while trying to set the bot's status:", err);
    }
  }
}