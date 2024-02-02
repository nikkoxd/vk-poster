import { Subcommand } from "@sapphire/plugin-subcommands";
import { t } from "i18next";
import { PermissionFlagsBits } from "discord.js";
import ShopItem from "../schemas/ShopItem";

export class ShopCommand extends Subcommand {
  public constructor(
    ctx: Subcommand.LoaderContext,
    options: Subcommand.Options,
  ) {
    super(ctx, {
      ...options,
      name: "shop",
      subcommands: [
        {
          name: "add",
          chatInputRun: "chatInputAdd",
        },
        {
          name: "remove",
          chatInputRun: "chatInputRemove",
        },
      ],
    });
  }

  public override registerApplicationCommands(registry: Subcommand.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("shop")
          .setDescription(t("commands.shop.description"))
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
          .addSubcommand((command) =>
            command
              .setName("add")
              .setDescription(t("commands.shop.add.description"))
              .addRoleOption((option) =>
                option
                  .setName(t("commands.shop.role.name"))
                  .setDescription(t("commands.shop.add.role.description"))
                  .setRequired(true),
              )
              .addNumberOption((option) =>
                option
                  .setName(t("commands.shop.add.price.name"))
                  .setDescription(t("commands.shop.add.price.description"))
                  .setRequired(true),
              )
              .addStringOption((option) =>
                option
                  .setName(t("commands.shop.add.duration.name"))
                  .setDescription(t("commands.shop.add.duration.description"))
                  .setRequired(false),
              ),
          )
          .addSubcommand((command) =>
            command
              .setName("remove")
              .setDescription(t("commands.shop.remove.description"))
              .addRoleOption((option) =>
                option
                  .setName(t("commands.shop.role.name"))
                  .setDescription(t("commands.shop.remove.role.description"))
                  .setRequired(true),
              ),
          ),
      { idHints: [] },
    );
  }

  public async chatInputAdd(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const role = interaction.options.getRole(
      t("commands.shop.role.name"),
      true,
    );
    const price = interaction.options.getNumber(
      t("commands.shop.add.price.name"),
      true,
    );
    const duration = interaction.options.getString(
      t("commands.shop.add.duration.name"),
      false,
    );

    const shopItem = await ShopItem.findOneAndUpdate(
      { roleId: role.id },
      { $setOnInsert: { price: price, duration: duration } },
      { upsert: true },
    );

    if (shopItem) {
      interaction.reply({
        content: t("commands.shop.roleAlreadyExists"),
        ephemeral: true,
      });
    } else {
      interaction.reply({
        content: t("commands.shop.roleAdded"),
        ephemeral: true,
      });
    }
  }

  public async chatInputRemove(
    interaction: Subcommand.ChatInputCommandInteraction,
  ) {
    const role = interaction.options.getRole(
      t("commands.shop.role.name"),
      true,
    );

    const shopItem = await ShopItem.findOneAndDelete({ roleId: role.id });

    if (shopItem) {
      interaction.reply({
        content: t("commands.shop.roleDeleted"),
        ephemeral: true,
      });
    } else {
      interaction.reply({
        content: t("commands.shop.roleDoesNotExist"),
        ephemeral: true,
      });
    }
  }
}
