import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import { SERVICE_PATHS } from "../../../core/lib/constants/paths";
import { CliError } from "../../../lib/errors";
import { App } from "../../app";

const removeLaunchdPlist = () => {
  const plistPath = SERVICE_PATHS.darwin;
  if (fs.existsSync(plistPath)) {
    fs.unlinkSync(plistPath);
  }
};

export const stopCommand = async (app: App, argv: string[]) => {
  const logger = app.getLogger();
  try {
    const platform = os.platform();
    let command: string;
    let args: string[];

    switch (platform) {
      case "darwin": // macOS
        command = "launchctl";
        args = ["unload", "-w", SERVICE_PATHS.darwin];
        break;
      case "linux":
        command = "systemctl";
        args = ["--user", "stop", "mcpctld"];
        break;
      case "win32":
        command = "net";
        args = ["stop", "mcpctld"];
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    console.log(`Stopping MCP daemon service on ${platform}...`);
    const child = spawn(command, args, {
      stdio: "inherit",
    });

    await new Promise((resolve, reject) => {
      child.on("close", (code) => {
        if (code === 0) {
          if (platform === "darwin") {
            removeLaunchdPlist();
          }
          console.log("MCP daemon service stopped successfully");
          resolve(undefined);
        } else {
          reject(
            new Error(`Failed to stop MCP daemon service with code ${code}`)
          );
        }
      });
    });
  } catch (error) {
    logger.error("Failed to stop MCP daemon service:", { error });
    throw new CliError("Failed to stop MCP daemon service");
  }
};
