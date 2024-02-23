import { Command } from "@sapphire/framework";
import { isMessageInstance } from "@sapphire/discord.js-utilities";
import { PermissionFlagsBits } from "discord.js";
import i18next from "i18next";

export class PingCommand extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("ping")
          .setDescription(i18next.t("commands.ping.description"))
          .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      { idHints: [process.env.PING_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const msg = await interaction.reply({
      content: i18next.t("commands.ping.waiting"),
      ephemeral: true,
      fetchReply: true,
    });

    if (isMessageInstance(msg)) {
      const diff = msg.createdTimestamp - interaction.createdTimestamp;
      const ping = Math.round(this.container.client.ws.ping);
      // prettier-ignore
      return interaction.editReply(
        `${i18next.t("commands.ping.success")} (Round trip took: ${diff}ms. Heartbeat: ${ping}ms.)`,
      );
    }

    return interaction.editReply(i18next.t("commands.ping.failure"));
  }
}
