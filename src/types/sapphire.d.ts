import { container } from "@sapphire/framework";
import Scheduler from "../scheduler";

declare module "@sapphire/pieces" {
  interface Container {
    scheduler: Scheduler;
  }
}
