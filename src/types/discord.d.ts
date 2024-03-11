import { client } from "..";
import { error, log } from "../logger";

declare module "discord.js" {
  export interface Client {
    error: typeof error;
    log: typeof log;
  }
}
