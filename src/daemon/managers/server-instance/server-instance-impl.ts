import { ChildProcess, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { LOG_PATHS } from "../../../core/lib/constants/paths";
import { Logger } from "../../../lib/logger/logger";
import {
  McpServerInstance,
  McpServerInstanceConnectionInfo,
  McpServerInstanceStatus,
} from "../../../lib/types/instance";
import { RunConfig, getRunConfigId } from "../../../lib/types/run-config";
import { PortService } from "../../services/port/port-service";

// Base worker implementation
export abstract class BaseServerInstance implements McpServerInstance {
  id: string;
  status: McpServerInstanceStatus = McpServerInstanceStatus.STARTING;
  error?: Error;
  process?: ChildProcess;
  containerId?: string;
  connectionInfo: McpServerInstanceConnectionInfo;
  startedAt: string;
  lastUsedAt: string;
  protected portService: PortService;

  constructor(
    public config: RunConfig,
    protected logger: Logger,
    portService: PortService
  ) {
    this.id = `server-instance.${uuidv4()}`;
    this.connectionInfo = {
      transport: "sse",
      baseUrl: "http://localhost:8000",
      port: 8000,
      endpoint: `/sse`,
    };
    this.startedAt = new Date().toISOString();
    this.lastUsedAt = new Date().toISOString();
    this.portService = portService;
    this.logger = this.logger.withContext(
      `ServerInstance:${this.id}(${this.config.serverName})`
    );
    this.logger.info("Server instance created", {
      id: this.id,
      configId: getRunConfigId(this.config),
      hosting: this.config.hosting,
    });
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  // JSON-RPC 메시지를 보내는 메서드
  async sendJsonRpcMessage(message: any): Promise<void> {
    if (!this.process?.stdin) {
      throw new Error("Process stdin is not available");
    }

    const jsonMessage = JSON.stringify(message) + "\n";
    this.process.stdin.write(jsonMessage);
  }
}

// Local process worker implementation
export class LocalServerInstance extends BaseServerInstance {
  async start(): Promise<void> {
    this.logger.info("Starting local server instance", {
      configId: getRunConfigId(this.config),
    });
    try {
      const port = await this.portService.allocatePort();
      this.logger.debug("Port allocated", { port });

      // Create log directory if it doesn't exist
      const logDir = path.join(
        LOG_PATHS[process.platform as keyof typeof LOG_PATHS],
        "server-instances"
      );
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Create log file path
      const logFile = path.join(
        logDir,
        `${this.config.serverName}-${this.config.profileName || "default"}.log`
      );

      // Initialize log file (clear existing content)
      fs.writeFileSync(logFile, "");

      // Create write streams for stdout and stderr
      const stdoutStream = fs.createWriteStream(logFile, { flags: "a" });
      const stderrStream = fs.createWriteStream(logFile, { flags: "a" });

      // command를 배열로 분리하고 shell 옵션을 고려
      const [cmd, ...args] = this.config.command.split(" ");
      const stdioCmd = `${cmd} ${args.join(" ")}`.trim();

      this.logger.debug("Starting process", { stdioCmd });
      // supergateway의 STDIO 통신 방식에 맞춰서 설정
      this.process = spawn(
        "npx",
        [
          "-y",
          "supergateway",
          "--stdio",
          stdioCmd,
          "--port",
          port.toString(),
          "--baseUrl",
          `http://localhost:${port}`,
          "--ssePath",
          "/sse",
          "--messagePath",
          "/message",
        ],
        {
          stdio: ["pipe", "pipe", "pipe"],
          shell: false,
          windowsHide: true,
          env: {
            ...process.env,
            ...this.config.env,
          },
        }
      );

      // Handle stdout with proper buffering and JSON parsing
      let stdoutBuffer = "";
      this.process.stdout?.on("data", (chunk: Buffer) => {
        const data = chunk.toString("utf8");
        stdoutBuffer += data;

        // Try to find complete JSON messages
        let startIndex = 0;
        while (true) {
          const jsonStart = stdoutBuffer.indexOf("{", startIndex);
          if (jsonStart === -1) break;

          try {
            // Try to parse from jsonStart to end
            const potentialJson = stdoutBuffer.slice(jsonStart);
            const parsed = JSON.parse(potentialJson);

            // If successful, log and remove the parsed part
            this.logger.info("Worker stdout (JSON):", { message: parsed });
            stdoutBuffer = stdoutBuffer.slice(0, jsonStart);
            startIndex = 0;
          } catch (e) {
            // If parsing failed, try next potential JSON start
            startIndex = jsonStart + 1;
          }
        }

        // If buffer is too large, log the remaining data as plain text
        if (stdoutBuffer.length > 10000) {
          this.logger.info("Worker stdout (text):", { message: stdoutBuffer });
          stdoutBuffer = "";
        }
      });

      // Handle stderr
      this.process.stderr?.on("data", (message: any) => {
        const msg = message.toString().trim();
        this.logger.error("Worker stderr:", { message: msg });
        stderrStream.write(msg + "\n");
      });

      this.process.on("exit", (code: number | null, signal: string | null) => {
        this.logger.info("Worker process exited", { code, signal });
        this.status = McpServerInstanceStatus.STOPPED;
        this.process = undefined;
        this.portService.releasePort(port);
      });

      this.connectionInfo.endpoint = `/sse`;
      this.connectionInfo.baseUrl = `http://localhost:${port}`;
      this.connectionInfo.port = port;
      this.connectionInfo.params = {
        port,
        baseUrl: `http://localhost:${port}`,
      };
      this.status = McpServerInstanceStatus.RUNNING;
      this.logger.info("Local server instance started successfully", {
        port,
        status: this.status,
      });
    } catch (error) {
      this.status = McpServerInstanceStatus.FAILED;
      this.error = error as Error;
      this.logger.error("Failed to start local server instance", { error });
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.logger.info("Stopping local server instance");
    if (this.process) {
      this.logger.debug("Killing worker process");
      this.process.kill();
      this.process = undefined;
      this.portService.releasePort(this.connectionInfo.port);
    }
    this.status = McpServerInstanceStatus.STOPPED;
    this.logger.info("Local server instance stopped", { status: this.status });
  }
}

// Container worker implementation
class ContainerServerInstance extends BaseServerInstance {
  async start(): Promise<void> {
    this.logger.info("Starting container server instance", {
      configId: getRunConfigId(this.config),
    });
    try {
      // TODO: Implement container creation and start
      this.logger.warn("Container implementation not yet available");
      this.status = McpServerInstanceStatus.RUNNING;
      this.logger.info("Container server instance started", {
        status: this.status,
      });
    } catch (error) {
      this.status = McpServerInstanceStatus.FAILED;
      this.error = error as Error;
      this.logger.error("Failed to start container server instance", { error });
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.logger.info("Stopping container server instance");
    if (this.containerId) {
      this.logger.debug("Stopping and removing container", {
        containerId: this.containerId,
      });
      // TODO: Implement container stop and removal
      this.logger.warn("Container stop implementation not yet available");
      this.containerId = undefined;
    }
    this.status = McpServerInstanceStatus.STOPPED;
    this.logger.info("Container server instance stopped", {
      status: this.status,
    });
  }
}
