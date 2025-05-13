import { v4 as uuidv4 } from "uuid";
import { McpClientType } from "../client";
import {
  McpServerInstanceConnectionInfo,
  McpServerInstanceStatus,
} from "../server";
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

export const newSession = (
  params: Omit<Session, "id" | "startedAt" | "status">
): Session => {
  return {
    ...params,
    id: `session.${uuidv4()}`,
    startedAt: new Date().toISOString(),
    status: SessionStatus.PENDING,
  };
};
