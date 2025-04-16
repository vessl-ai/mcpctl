import { spawn } from "child_process";
import os from "os";
import path from "path";
import { FileLogger } from "../../../../lib/logger/file-logger";
import { McpServerHostingType } from "../../../../lib/types/hosting";
import { RunConfig } from "../../../../lib/types/run-config";
import { App } from "../../app";

const buildSessionConnectCommand = (app: App) => {
  const logger = new FileLogger({
    filePath: path.join(os.homedir(), ".mcpctl", "logs", "session-connect.log"),
    prefix: "session-connect",
    showVerbose: true,
  });
  return {
    action: async (options: any) => {
      // 필수 옵션 확인
      if (!options.s && !options.server) {
        console.error(
          "Error: Server name is required. Use -s or --server option."
        );
        process.exit(1);
      }

      if (!options.c && !options.command) {
        console.error(
          "Error: Command is required. Use -c or --command option."
        );
        process.exit(1);
      }

      const serverName = options.s || options.server;
      const command = options.c || options.command;
      const profileName = options.p || options.profile || "default";

      logger.info("Connect command", { serverName, profileName, command });

      // RunConfig 객체 생성
      const runConfig: RunConfig = {
        hosting: McpServerHostingType.LOCAL,
        serverName,
        profileName,
        command,
        created: new Date().toISOString(),
        env: {}, // 빈 환경 변수 객체 추가
      };

      let session;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const sessionManager = app.getSessionManager();
          session = await sessionManager.connect(runConfig);
          logger.info("Session created", session);
          break; // 성공하면 루프 종료
        } catch (error) {
          retryCount++;
          logger.error(
            `Failed to connect (attempt ${retryCount}/${maxRetries}):`,
            error
          );

          if (retryCount >= maxRetries) {
            console.error(
              "Failed to connect to daemon after multiple attempts. Please make sure the daemon is running."
            );
            process.exit(1);
          }

          // 잠시 대기 후 재시도
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!session) {
        console.error("Failed to create a session.");
        process.exit(1);
      }

      const connectionUrl = `${session.connectionInfo.baseUrl}${session.connectionInfo.endpoint}`;
      logger.info("Connecting to" + connectionUrl);

      const child = spawn(
        `npx`,
        ["-y", "supergateway", "--sse", connectionUrl],
        {
          stdio: ["pipe", "pipe", "pipe"],
        }
      );

      child.on("exit", (code, signal) => {
        logger.info(
          `Child process exited with code ${code} and signal ${signal}`
        );
      });

      child.on("error", (error) => {
        logger.error("Child process error", error);
      });

      process.on("SIGINT", () => {
        child.kill();
      });
      process.on("SIGTERM", () => {
        child.kill();
      });
      child.stdout!.pipe(process.stdout);
      child.stderr!.pipe(process.stderr);
      process.stdin.pipe(child.stdin!);
    },
  };
};

export { buildSessionConnectCommand };
