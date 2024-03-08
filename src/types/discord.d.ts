import { log } from "../logger";

declare module "discord.js" {
  export interface Client {
    log: typeof log;
  }
}
