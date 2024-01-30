import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import {
  EmbedBuilder,
  type ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  Role,
} from "discord.js";
import { t } from "i18next";
import ShopItem, { IShopItem } from "../schemas/ShopItem";

export class ShopButtonHandler extends InteractionHandler {
  public constructor(
    ctx: InteractionHandler.LoaderContext,
    options: InteractionHandler.Options,
  ) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.Button,
    });
  }

  public override parse(interaction: ButtonInteraction) {
    return interaction.customId === "shop" ? this.some() : this.none();
  }

  private createEmbedFields(role: Role, roleItem: IShopItem) {
    let value = `**Цена:** ${roleItem.price} монеток`;
    if (roleItem.duration)
      value = `${value}\n**Длительность:** ${roleItem.duration}`;
    return {
      name: role ? role.name : "Unknown Role",
      value,
      inline: true,
    };
  }

  private async fetchShopRoles(interaction: ButtonInteraction) {
    const roles = await ShopItem.find();
    return Promise.all(
      roles.map(async (roleItem: IShopItem) => {
        try {
          const role = await interaction.guild!.roles.fetch(roleItem.roleId);
          return { role, roleItem };
        } catch (error) {
          this.container.logger.error(
            `Error fetching role ${roleItem.roleId}:`,
            error,
          );
          return { role: null, roleItem };
        }
      }),
    );
  }

  public async run(interaction: ButtonInteraction) {
    if (interaction.guild) {
      const embed = new EmbedBuilder()
        .setTitle("Магазин")
        .setColor(`#${process.env.EMBED_COLOR}`);
      const roleOptions: StringSelectMenuOptionBuilder[] = [];

      try {
        const roleData = await this.fetchShopRoles(interaction);

        roleData.forEach(({ role, roleItem }) => {
          if (role) {
            embed.addFields(this.createEmbedFields(role, roleItem));

            roleOptions.push(
              new StringSelectMenuOptionBuilder()
                .setLabel(role.name)
                .setValue(role.id),
            );
          }
        });

        const menu = new StringSelectMenuBuilder()
          .setCustomId("shop-select")
          .setPlaceholder(t("shop.selectRole"))
          .addOptions(roleOptions);

        const row =
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

        await interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true,
        });
      } catch (error) {
        this.container.logger.error("Error fetching shop roles:", error);
      }
    }
  }
}
