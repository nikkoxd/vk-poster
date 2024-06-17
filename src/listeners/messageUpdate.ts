import { Listener } from "@sapphire/framework";
import { Message } from "discord.js";
import Guild from "../schemas/Guild";
import Member from "../schemas/Member";
import i18next from "i18next";

export class messageUpdateListener extends Listener {
  public constructor(
    context: Listener.LoaderContext,
    options: Listener.Options,
  ) {
    super(context, {
      ...options,
      event: "messageUpdate",
      once: false,
    });
  }

  public override async run(_: Message, newMessage: Message) {
    const SDCMonitoring = "464272403766444044";
    const guild = await Guild.findOne({ guildId: newMessage.guild?.id });
    if (!guild) {
      return;
    }

    if (newMessage.author.id != SDCMonitoring || newMessage.interaction?.commandName != "up") {
      return;
    }

    const embed = newMessage.embeds[0];
    if (!embed || !embed.description) {
      return;
    }

    const regex = new RegExp("Успешный Up!");
    if (!regex.test(embed.description)) {
      return;
    }

    const author = newMessage.interaction.user;
    const authorRecord = await Member.findOne({ memberId: author.id });
    await authorRecord?.updateOne({
      coins: authorRecord.coins + guild.coins.bumpReward,
    });

    newMessage.reply(
      i18next.t("listeners.messageCreate.bumpRewarded", {
        memberId: author.id,
        coins: guild.coins.bumpReward,
      }),
    );
  }
}
