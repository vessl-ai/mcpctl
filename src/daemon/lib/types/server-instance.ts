import { WorkerConnectionInfo } from "../../services/orchestrator/types";
import { RunConfig } from "./run-config";

export type ServerInstance = {
  id: string;
  workerId: string;
  config: RunConfig;
  status: "running" | "stopped" | "failed";
  startedAt: string;
  lastUsedAt?: string;
  connectionInfo: WorkerConnectionInfo;
  error?: Error;
};
