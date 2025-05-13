import axios, { AxiosInstance } from "axios";
import { Logger } from "../logger/logger";
import { DaemonStatus } from "../types/daemon";
import { McpServerInstance, RunConfig } from "../types/server";

export interface DaemonRPCClient extends Disposable {
  startInstance(config: RunConfig): Promise<McpServerInstance>;
  stopInstance(instanceId: string): Promise<void>;
  getInstance(instanceId: string): Promise<McpServerInstance | null>;
  listInstances(): Promise<McpServerInstance[]>;
  status(): Promise<DaemonStatus>;
  shutdown(): Promise<void>;
}

export class HttpDaemonRPCClient implements DaemonRPCClient {
  private httpClient: AxiosInstance;

  constructor(private readonly logger: Logger) {
    const baseUrl = "http://localhost:8080";
    this.httpClient = axios.create({
      baseURL: "http://localhost:8080",
    });
  }

  // Instance management methods
  async startInstance(config: RunConfig): Promise<McpServerInstance> {
    this.logger.debug("Sending start instance request", { config });
    return await this.httpClient.post("/instance/start", {
      config,
    });
  }

  async stopInstance(instanceId: string): Promise<void> {
    this.logger.debug("Sending stop instance request", { instanceId });
    await this.httpClient.post("/instance/stop", {
      instanceId,
    });
  }

  async getInstance(instanceId: string): Promise<McpServerInstance | null> {
    this.logger.debug("Sending get instance request", { instanceId });
    return await this.httpClient.get(`/instance/${instanceId}`);
  }

  async listInstances(): Promise<McpServerInstance[]> {
    this.logger.debug("Sending list instances request");
    return await this.httpClient.get("/instance");
  }

  async status(): Promise<DaemonStatus> {
    this.logger.debug("Sending status request");
    return await this.httpClient.get("/status");
  }

  async shutdown(): Promise<void> {
    this.logger.debug("Sending shutdown request");
    await this.httpClient.post("/shutdown");
  }

  [Symbol.dispose](): void {
    this.logger.verbose("RPC client disposed");
  }
}
