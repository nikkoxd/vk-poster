import { Command } from "@sapphire/framework";
import { logError } from "..";
import i18next from "i18next";
import Guild from "../schemas/Guild";
import RoleReward from "../schemas/RoleReward";

export class expConfigCommand extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("exp-config")
          .setDescription("Настройка опыта")
          .addRoleOption((option) =>
            option
              .setName("роль")
              .setDescription("Роль, выдающаяся в награду")
              .setRequired(true),
          )
          .addIntegerOption((option) =>
            option
              .setName("уровень")
              .setDescription("Уровень")
              .setRequired(true),
          ),
      { idHints: [process.env.EXP_CONFIG_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const role = interaction.options.getRole("роль", true);
    const level = interaction.options.getInteger("уровень", true);

    const roleItem = await RoleReward.findOne({ id: role.id, level: level });
    if (roleItem) {
      interaction.reply({
        content: "За данный уровень уже выдается эта роль",
        ephemeral: true,
      });
    } else {
      const roleItem = new RoleReward({ id: role.id, level: level });
      roleItem.save();

      interaction.reply({
        content: `За ${level} уровень теперь будет выдаваться роль <@&${role.id}>`,
        ephemeral: true,
      });
    }
  }
}
