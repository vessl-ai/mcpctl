import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { LOG_PATHS, SERVICE_PATHS } from "../../../core/lib/constants/paths";
import {
  getMcpctldServiceTemplate,
  SERVICE_COMMANDS,
  type ServiceTemplateOptions,
} from "../../../core/lib/service-templates";
import { CliError } from "../../../lib/errors";
import { App } from "../../app";

const createLogDirectories = () => {
  const platform = os.platform();
  const logDir = LOG_PATHS[platform as keyof typeof LOG_PATHS];

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
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
    logDir: LOG_PATHS[platform as keyof typeof LOG_PATHS],
  };

  const serviceContent = getMcpctldServiceTemplate(templateOptions);

  // Windows는 서비스 생성 명령어를 반환하므로 별도 처리
  if (platform === "win32") {
    execSync(serviceContent);
    return;
  }

  // Unix 시스템은 서비스 파일 생성
  const servicePath = SERVICE_PATHS[platform as keyof typeof SERVICE_PATHS];

  // Ensure parent directories exist
  const parentDir = path.dirname(servicePath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

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
