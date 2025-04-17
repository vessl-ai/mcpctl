import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import { App } from "../../app";

const checkSudoPrivileges = () => {
  if (process.getuid && process.getuid() !== 0) {
    throw new Error(
      "This command requires root privileges. Please run with sudo."
    );
  }
};

const removeLaunchdPlist = () => {
  const plistPath = "/Library/LaunchDaemons/com.mcpctl.daemon.plist";
  if (fs.existsSync(plistPath)) {
    fs.unlinkSync(plistPath);
  }
};

const stopCommandOptions = {};

export const stopCommand = async (app: App, argv: string[]) => {
  try {
    // sudo 권한 체크
    checkSudoPrivileges();

    const platform = os.platform();
    let command: string;
    let args: string[];

    switch (platform) {
      case "darwin": // macOS
        command = "launchctl";
        args = [
          "unload",
          "-w",
          "/Library/LaunchDaemons/com.mcpctl.daemon.plist",
        ];
        break;
      case "linux":
        command = "sudo";
        args = ["systemctl", "stop", "mcpctld"];
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
    console.error(
      "Failed to stop MCP daemon service:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
};
