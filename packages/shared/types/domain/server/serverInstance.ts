import { ChildProcess } from "child_process";
import { Transport } from "../../common/transport";
import { ServerRunSpec } from "./serverRunSpec";

export enum ServerInstanceStatus {
  Pending = "pending",
  Running = "running",
  Stopped = "stopped",
  Error = "error",
}

export interface ServerInstance {
  id: string;
  name: string;
  runSpec: ServerRunSpec;
  status: ServerInstanceStatus;
  transport: Transport;
  processId?: number;
  processHandle?: ChildProcess;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  host: string;
  port: number;
  connectionUrl?: string;
  logsPath?: string;
  terminatedAt?: string; // ISO 8601
  resources?: {
    cpu: number;
    memory: number;
    disk: number;
  };
}
