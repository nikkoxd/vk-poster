# 💫 Stella

[![Discord](https://img.shields.io/discord/764191923954122752)](https://discord.gg/starrysky)
[![Fly Deploy](https://github.com/nikkoxd/stella/actions/workflows/fly.yml/badge.svg)](https://github.com/nikkoxd/stella/actions/workflows/fly.yml)
[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://opensource.org/licenses/)

General purpose bot built for https://discord.gg/starrysky

## 🚀 Deployment

Add your bot token as `DISCORD_TOKEN` to `Secrets.toml`.
To deploy to shuttle.dev:
```sh
$ shuttle deploy
```

## 💻 Development

First, get the database URL from shuttle CLI:
```sh
$ shuttle resource list --show-secrets
```
Add the connection string to `Secrets.dev.toml` as `CONNECTION_URL`,  
then add the same variable to `Secrets.toml` but set it to empty value so that it doesn't crash in deployment.

To run the bot locally, run:
```sh
$ shuttle run
```
If you want to use a different token locally, you can set it in `Secrets.dev.toml`.
