# 💫 Stella

General purpose bot built for https://discord.gg/starrysky

## Running the bot

Clone this repository, copy `.env.example` to `.env` and fill in the empty configurations

To run, use the following commands:

```
# npm
npm run start

# yarn
yarn start
```

## Translating the bot

To add new translations, go to `/locales`,
make a folder there with your language's code
and make a JSON file named `translation.json`, then
preload your translation in `/src/index.ts`:

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

## TODO

- Connect things to MongoDB

## License

This project is licensed under [GNU General Public License v3.0][license]

[license]: https://github.com/nikkoxd/stella/blob/main/LICENSE
