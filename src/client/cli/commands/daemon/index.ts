import { Command } from "commander";
import { App } from "../../app";
import { buildStartCommand } from "./start";
import { buildStatusCommand } from "./status";
import { buildStopCommand } from "./stop";


export const buildDaemonCommand = (app: App): Command => {
  return new Command('daemon')
    .description('Manage the MCP daemon')
    .addCommand(buildStartCommand(app))
    .addCommand(buildStopCommand(app))
    .addCommand(buildStatusCommand(app));
};