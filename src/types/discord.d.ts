import { error, log } from "../logger";
import { Scheduler } from "../scheduler";

declare module "discord.js" {
  export interface Client {
    error: typeof error;
    log: typeof log;
    scheduler: Scheduler;
  }
}
