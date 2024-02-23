import {
  InteractionHandler,
  InteractionHandlerTypes,
} from "@sapphire/framework";
import type {
  GuildMemberRoleManager,
  StringSelectMenuInteraction,
} from "discord.js";
import ShopItem from "../schemas/ShopItem";
import Member from "../schemas/Member";
import ms from "ms";
import i18next from "i18next";
import { logError } from "..";

export class ShopSelectHandler extends InteractionHandler {
  public constructor(
    ctx: InteractionHandler.LoaderContext,
    options: InteractionHandler.Options,
  ) {
    super(ctx, {
      ...options,
      interactionHandlerType: InteractionHandlerTypes.SelectMenu,
    });
  }

  public override parse(interaction: StringSelectMenuInteraction) {
    return interaction.customId === "shop-select" ? this.some() : this.none();
  }

  public async run(interaction: StringSelectMenuInteraction) {
    try {
      const { member, guild } = interaction;
      const roleId = interaction.values[0];
      const role = await guild!.roles.fetch(roleId);

      if (!role) return;

      const roleItem = await ShopItem.findOne({ roleId: role.id });
      const userItem = await Member.findOne({ memberId: member!.user.id });

      if (userItem && roleItem) {
        const memberRoles = member!.roles as GuildMemberRoleManager;

        if (memberRoles.cache.get(role.id)) {
          interaction.reply({
            content: i18next.t("shop.memberAlreadyHasRole"),
            ephemeral: true,
          });
        } else {
          const { coins, roles } = userItem;

          if (coins >= roleItem.price) {
            await userItem.updateOne({
              coins: userItem.coins - roleItem.price,
            });
            memberRoles.add(role);

            if (roleItem.duration) {
              const newRoles = roles || [];
              newRoles.push({
                guildId: interaction.guild!.id,
                roleId: role.id,
                expiryDate: Date.now() + ms(roleItem.duration),
              });
              await userItem.updateOne({ roles: newRoles });
            }

            interaction.reply({
              content: `${i18next.t("shop.roleGiven")} <@&${role.id}>!`,
              ephemeral: true,
            });
          } else {
            interaction.reply({
              content: i18next.t("shop.notEnoughCoins"),
              ephemeral: true,
            });
          }
        }
      }
    } catch (err: any) {
      logError(err, interaction);
    }
  }
}
