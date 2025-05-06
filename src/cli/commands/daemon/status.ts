import { DaemonRPCClient } from "../../../core/lib/rpc/client";
import { CliError } from "../../../lib/errors";
import { App } from "../../app";

const statusCommandOptions = {};

export const statusCommand = async (app: App) => {
  let daemonClient: DaemonRPCClient | undefined;
  const logger = app.getLogger();
  try {
    daemonClient = await DaemonRPCClient.getInstance(app.getLogger());
    const status = await daemonClient.status();
    console.log(`Daemon status: ${status.isRunning ? "running" : "stopped"}`);
    console.log(`Daemon uptime: ${status.uptime}ms`);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      logger.error(
        "No daemon found. Please start the daemon first by `mcpctl daemon start`"
      );
      throw new CliError(
        "No daemon found. Please start the daemon first by `mcpctl daemon start`"
      );
    }
    logger.error("Failed to get daemon status:", { error });
    throw new CliError("Failed to get daemon status");
  } finally {
    if (daemonClient) {
      daemonClient.dispose();
    }
  }
};
