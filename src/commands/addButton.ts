import { Command } from "@sapphire/framework";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
} from "discord.js";
import { logError } from "..";
import { readFile } from "fs";
import { t } from "i18next";

export class AddButtonCommand extends Command {
  public constructor(ctx: Command.LoaderContext, options: Command.Options) {
    super(ctx, { ...options });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName("addcomponent")
          .setDescription(t("commands.addButton.description"))
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
          .addStringOption((option) =>
            option
              .setName(t("commands.addButton.options.id.name"))
              .setDescription(t("commands.addButton.options.id.description"))
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName(t("commands.addButton.options.label.name"))
              .setDescription(t("commands.addButton.options.label.description"))
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName(t("commands.addButton.options.style.name"))
              .setDescription(t("commands.addButton.options.style.description"))
              .addChoices(
                {
                  name: t("commands.addButton.options.style.choices.primary"),
                  value: "primary",
                },
                {
                  name: t("commands.addButton.options.style.choices.secondary"),
                  value: "secondary",
                },
                {
                  name: t("commands.addButton.options.style.choices.success"),
                  value: "success",
                },
                {
                  name: t("commands.addButton.options.style.choices.danger"),
                  value: "danger",
                },
                {
                  name: t("commands.addButton.options.style.choices.link"),
                  value: "link",
                },
              )
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName(t("commands.addButton.options.action.name"))
              .setDescription(
                t("commands.addButton.options.action.description"),
              )
              .setRequired(true),
          ),
      { idHints: [process.env.ADDCOMPONENT_ID as string] },
    );
  }

  public async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    const message = interaction.channel?.messages.fetch(
      interaction.options.getString(
        t("commands.addButton.options.id.name"),
        true,
      ),
    );
    const label = interaction.options.getString(
      t("commands.addButton.options.label.name"),
      true,
    );
    const styleValue = interaction.options.getString(
      t("commands.addButton.options.style.name"),
      true,
    );
    const action = interaction.options.getString(
      t("commands.addButton.options.action.name"),
      true,
    );
    let style: ButtonStyle = ButtonStyle.Primary;

    const button = new ButtonBuilder();
    const row = new ActionRowBuilder<ButtonBuilder>();

    switch (styleValue) {
      case "primary":
        style = ButtonStyle.Primary;
        break;
      case "secondary":
        style = ButtonStyle.Secondary;
        break;
      case "success":
        style = ButtonStyle.Success;
        break;
      case "danger":
        style = ButtonStyle.Danger;
        break;
      case "link":
        style = ButtonStyle.Link;
        break;
    }

    switch (styleValue) {
      case "primary" || "secondary" || "success" || "danger":
        this.container.logger.info("Message sending button being added");

        const fileName = action;
        const filePath = `./dist/messages/${fileName}.json`;

        readFile(
          filePath,
          "utf-8",
          async (err: NodeJS.ErrnoException | null, data: string) => {
            if (err) {
              logError(err, interaction);
            } else {
              try {
                button
                  .setCustomId("sendmsg" + "-" + action)
                  .setLabel(label)
                  .setStyle(style as ButtonStyle);

                row.addComponents(button);

                (await message)?.edit({ components: [row] });
              } catch (err) {
                logError(err, interaction);
              } finally {
                interaction.reply({
                  content: t("commands.addButton.success"),
                  ephemeral: true,
                });
              }
            }
          },
        );

        break;
      case "link":
        this.container.logger.info("URL sending button being added");

        try {
          button
            .setLabel(label)
            .setStyle(style as ButtonStyle)
            .setURL(action);

          row.addComponents(button);

          (await message)?.edit({ components: [row] });
        } catch (err) {
          logError(err, interaction);
        } finally {
          interaction.reply({
            content: t("commands.addButton.success"),
            ephemeral: true,
          });
        }

        break;
    }
  }
}
