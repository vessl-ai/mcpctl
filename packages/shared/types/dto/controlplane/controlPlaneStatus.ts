import { ServerInstance } from "../../domain/server";

export interface ControlPlaneStatus {
  status: "running" | "stopped";
  version: string;
  mcpServers: ServerInstance[];
}
