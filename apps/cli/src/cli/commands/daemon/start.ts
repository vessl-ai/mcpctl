import {
  getMcpctldServiceTemplate,
  SERVICE_COMMANDS,
  SERVICE_PATHS,
  type ServiceTemplateOptions,
} from "@mcpctl/core";
import { CliError } from "@mcpctl/lib";
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
  return logDir;
};

const setupDaemonService = () => {
  const platform = os.platform();
  const logDir = createLogDirectories();

  // node 실행 파일의 전체 경로 찾기
  const { execSync } = require("child_process");
  const nodePath =
    platform === "win32"
      ? process.execPath
      : execSync("which node").toString().trim();
  const daemonPath =
    platform === "win32"
      ? execSync("where mcpctld").toString().trim()
      : execSync("which mcpctld").toString().trim();

  const templateOptions: ServiceTemplateOptions = {
    nodePath,
    daemonPath,
    logDir,
  };

  const serviceContent = getMcpctldServiceTemplate(templateOptions);

  // Windows는 서비스 생성 명령어를 반환하므로 별도 처리
  if (platform === "win32") {
    execSync(serviceContent);
    return;
  }

  // Unix 시스템은 서비스 파일 생성
  const servicePath = SERVICE_PATHS[platform as "darwin" | "linux"];
  fs.writeFileSync(servicePath, serviceContent);
  fs.chmodSync(servicePath, "644");

  // Linux의 경우 systemctl reload 필요
  if (platform === "linux") {
    execSync(SERVICE_COMMANDS.linux.reload.join(" "));
    execSync(SERVICE_COMMANDS.linux.enable.join(" "));
  }
};

export const startCommand = async (app: App) => {
  const logger = app.getLogger();
  try {
    // sudo 권한 체크
    checkSudoPrivileges();

    const platform = os.platform();

    // 서비스 설정
    setupDaemonService();

    // 서비스 시작
    const commands =
      SERVICE_COMMANDS[platform as keyof typeof SERVICE_COMMANDS];
    if (!commands) {
      logger.error(`Unsupported platform: ${platform}`);
      throw new Error(`Unsupported platform: ${platform}`);
    }

    console.log(`Starting MCP daemon service on ${platform}...`);
    const [command, ...args] = commands.start;
    const child = spawn(command, args, {
      stdio: "inherit",
    });

    await new Promise((resolve, reject) => {
      child.on("close", (code) => {
        if (code === 0) {
          console.log("MCP daemon service started successfully");
          resolve(undefined);
        } else {
          logger.error(`Failed to start MCP daemon service with code ${code}`);
          reject(
            new Error(`Failed to start MCP daemon service with code ${code}`)
          );
        }
      });
    });
  } catch (error) {
    logger.error("Failed to start MCP daemon service:", { error });
    throw new CliError("Failed to start MCP daemon service");
  }
};
