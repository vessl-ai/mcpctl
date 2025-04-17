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

const createLogDirectories = () => {
  const platform = os.platform();
  let logDir: string;

  switch (platform) {
    case "darwin":
    case "linux":
      logDir = "/var/log/mcpctl";
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      break;
    case "win32":
      logDir = "C:\\ProgramData\\mcpctl\\logs";
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      break;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};

const createLaunchdPlist = () => {
  // node 실행 파일의 전체 경로 찾기
  const { execSync } = require("child_process");
  const nodePath = execSync("which node").toString().trim();
  const daemonPath = "/usr/local/bin/mcpctld";

  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mcpctl.daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${daemonPath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/var/log/mcpctl/daemon.err</string>
    <key>StandardOutPath</key>
    <string>/var/log/mcpctl/daemon.out</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>`;

  const plistPath = "/Library/LaunchDaemons/com.mcpctl.daemon.plist";
  fs.writeFileSync(plistPath, plistContent);
  fs.chmodSync(plistPath, "644");
};

const startCommandOptions = {};

export const startCommand = async (app: App) => {
  try {
    // sudo 권한 체크
    checkSudoPrivileges();

    const platform = os.platform();
    let command: string;
    let args: string[];

    // 모든 OS에서 로그 디렉토리 생성
    createLogDirectories();

    switch (platform) {
      case "darwin": // macOS
        // plist 파일 생성 및 권한 설정
        createLaunchdPlist();
        command = "launchctl";
        args = ["load", "-w", "/Library/LaunchDaemons/com.mcpctl.daemon.plist"];
        break;
      case "linux":
        command = "sudo";
        args = ["systemctl", "start", "mcpctld"];
        break;
      case "win32":
        command = "net";
        args = ["start", "mcpctld"];
        break;
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    console.log(`Starting MCP daemon service on ${platform}...`);
    const child = spawn(command, args, {
      stdio: "inherit",
    });

    await new Promise((resolve, reject) => {
      child.on("close", (code) => {
        if (code === 0) {
          console.log("MCP daemon service started successfully");
          resolve(undefined);
        } else {
          reject(
            new Error(`Failed to start MCP daemon service with code ${code}`)
          );
        }
      });
    });
  } catch (error) {
    console.error(
      "Failed to start MCP daemon service:",
      error instanceof Error ? error.message : "Unknown error"
    );
    process.exit(1);
  }
};
