import {
  McpServerInstanceConnectionInfo,
  McpServerInstanceStatus,
} from "../../../../lib/types/instance";
import { McpClientType } from "./mcp-client";

export enum SessionStatus {
  PENDING = "pending",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
}

export interface Session {
  id: string;
  client?: McpClientType;
  instanceId: string;
  startedAt: string;
  status: SessionStatus;
  instanceStatus: McpServerInstanceStatus;
  connectionInfo: McpServerInstanceConnectionInfo;
  error?: Error;
}
