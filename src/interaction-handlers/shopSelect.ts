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
import { t } from "i18next";

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
    const { member, guild } = interaction;

    const role = await guild!.roles.fetch(interaction.values[0]);
    if (role) {
      const roleItem = await ShopItem.findOne({ roleId: role.id });
      const userItem = await Member.findOne({ memberId: member!.user.id });

      if (userItem && roleItem) {
        if ((member!.roles as GuildMemberRoleManager).cache.get(role.id)) {
          interaction.reply({
            content: t("shop.memberAlreadyHasRole"),
            ephemeral: true,
          });
        } else {
          if (userItem.coins >= roleItem.price) {
            await userItem.updateOne({
              coins: userItem.coins - roleItem.price,
            });
            (member!.roles as GuildMemberRoleManager).add(role);

            if (roleItem.duration) {
              const roles = userItem.roles || [];
              roles.push({
                guildId: interaction.guild!.id,
                roleId: role.id,
                expiryDate: Date.now() + ms(roleItem.duration),
              });
              await userItem.updateOne({ roles });
            }

            interaction.reply({
              content: `${t("shop.roleGiven")} <@&${role.id}>!`,
              ephemeral: true,
            });
          } else {
            interaction.reply({
              content: t("shop.notEnoughCoins"),
              ephemeral: true,
            });
          }
        }
      }
    }
  }
}
