# 💫 Stella

[![Discord](https://img.shields.io/discord/764191923954122752)](https://discord.gg/starrysky)
[![Fly Deploy](https://github.com/nikkoxd/stella/actions/workflows/fly.yml/badge.svg)](https://github.com/nikkoxd/stella/actions/workflows/fly.yml)
[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)

General purpose bot built for https://discord.gg/starrysky

This README is also available in: [RU](README_ru.md) | [EN](README.md)

## Running the bot

Clone this repository, copy `.env.example` to `.env`, fill in the empty configurations
and run the commands:

```
# npm
npm install

# yarn
yarn install
```

To run, use the following commands:

```
# npm
npm run start

# yarn
yarn start
```

## Custom messages

To make your own messages, insert a document
following the schema located at `src/schemas/Message.ts`

A proper solution is being worked on [here](https://github.com/nikkoxd/stella-embed-builder).

## Setting up a shop/room renting

To set up a shop or room renting:

1. Make a new message with a button.
2. Set the button's `customId` value to either `shop` or `room-rent`
3. Send the message via `/sendmsg` command

## Custom translations

To add new translations, preload your translation in `/src/index.ts`:

```ts
...
i18next.use(I18NexFsBackend).init<FsBackendOptions>(
  {
    lng: process.env.LANGUAGE,
    fallbackLng: "en",
    preload: ["en", "ru"], // add the language code here
    ns: ["translation"],
    defaultNS: "translation",
    backend: {
      loadPath: "./locales/{{lng}}/{{ns}}.json",
    },
  },
  (err, t) => {
    if (err) return client.logger.error(err);
    client.logger.info("i18next is ready...");
  },
);
...
```

Then, either make a new folder in `locales/`, or use [i18n Ally extension](https://marketplace.visualstudio.com/items?itemName=scaukk.i18n-downloader)

## License

This project is licensed under [GNU General Public License v3.0][license]

[license]: https://github.com/nikkoxd/stella/blob/main/LICENSE
