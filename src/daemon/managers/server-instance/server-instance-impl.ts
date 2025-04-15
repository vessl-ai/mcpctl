import { ChildProcess, spawn } from "child_process";
import { getPortPromise } from "portfinder";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "../../../lib/logger/logger";
import {
  McpServerInstance,
  McpServerInstanceConnectionInfo,
  McpServerInstanceStatus,
} from "../../../lib/types/instance";
import { RunConfig, getRunConfigId } from "../../../lib/types/run-config";

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

  constructor(public config: RunConfig, protected logger: Logger) {
    this.id = uuidv4();
    this.connectionInfo = {
      transport: "sse",
      baseUrl: "http://localhost:8000",
      port: 8000,
      endpoint: `/sse`,
    };
    this.startedAt = new Date().toISOString();
    this.lastUsedAt = new Date().toISOString();
    this.logger = this.logger.withContext(`ServerInstance:${this.id}`);
    this.logger.info("Server instance created", {
      id: this.id,
      configId: getRunConfigId(this.config),
      hosting: this.config.hosting,
    });
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}

// Local process worker implementation
export class LocalServerInstance extends BaseServerInstance {
  async start(): Promise<void> {
    this.logger.info("Starting local server instance", {
      configId: getRunConfigId(this.config),
    });
    try {
      this.logger.debug("Finding available port...");
      const port = await getPortPromise();
      this.logger.debug("Port allocated", { port });

      this.process = spawn("npx", [
        "-y",
        "supergateway",
        "--stdio",
        this.config.command,
        "--port",
        port.toString(),
        "--baseUrl",
        `http://localhost:${port}`,
        "--ssePath",
        "/sse",
        "--messagePath",
        "/message",
      ]);

      this.process.stdout?.on("data", (message: any) => {
        this.logger.info("Worker stdout:", {
          message: message.toString().trim(),
        });
      });

      this.process.stderr?.on("data", (message: any) => {
        this.logger.error("Worker stderr:", {
          message: message.toString().trim(),
        });
      });

      this.process.on("error", (error: Error) => {
        this.logger.error("Worker process error:", { error });
        this.status = McpServerInstanceStatus.FAILED;
        this.error = error;
      });

      this.process.on("exit", (code: number | null, signal: string | null) => {
        this.logger.info("Worker process exited", { code, signal });
        this.status = McpServerInstanceStatus.STOPPED;
        this.process = undefined;
      });

      this.connectionInfo.endpoint = `/sse`;
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
