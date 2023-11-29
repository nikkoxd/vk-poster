import { Command } from "@sapphire/framework";
import { isMessageInstance } from "@sapphire/discord.js-utilities";
import { PermissionFlagsBits } from "discord.js";

export class PingCommand extends Command {
  public constructor(ctx: Command.Context, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("ping")
          .setDescription("Понг!")
          .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      { idHints: [process.env.PING_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const msg = await interaction.reply({
      content: `Ping?`,
      ephemeral: true,
      fetchReply: true,
    });

    if (isMessageInstance(msg)) {
      const diff = msg.createdTimestamp - interaction.createdTimestamp;
      const ping = Math.round(this.container.client.ws.ping);
      return interaction.editReply(
        `Pong 🏓! (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`,
      );
    }

    return interaction.editReply("Failed to retrieve ping :(");
  }
}
