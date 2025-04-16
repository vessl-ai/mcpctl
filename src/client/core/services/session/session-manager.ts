import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "../../../../lib/logger/logger";
import { McpServerInstanceStatus } from "../../../../lib/types/instance";
import { RunConfig } from "../../../../lib/types/run-config";
import { getSessionDir } from "../../lib/env";
import { DaemonRPCClient } from "../../lib/rpc/client";
import { McpClientType } from "../../lib/types/mcp-client";
import { Session, SessionStatus } from "../../lib/types/session";

export interface SessionManager {
  // instance 연결
  connect(config: RunConfig, client?: McpClientType): Promise<Session>;

  // 연결 해제
  disconnect(sessionId: string, killInstance: boolean): Promise<void>;

  // 현재 연결 상태 조회
  getStatus(sessionId: string): Promise<Session>;

  // 현재 활성 세션 목록
  listSessions(): Promise<Session[]>;

  // 특정 클라이언트의 세션 목록
  listClientSessions(clientId: string): Promise<Session[]>;
}

class DefaultSessionManager implements SessionManager {
  private sessions: Map<string, Session>; // TODO: store in sqlite? or file

  constructor(private logger: Logger) {
    this.sessions = new Map();
  }

  async getDaemonClient(): Promise<DaemonRPCClient> {
    return await DaemonRPCClient.getInstance();
  }

  writeSessions(): void {
    if (!fs.existsSync(getSessionDir())) {
      fs.mkdirSync(getSessionDir(), { recursive: true });
    }
    for (const session of this.sessions.values()) {
      fs.writeFileSync(
        path.join(getSessionDir(), `${session.id}.json`),
        JSON.stringify(session, null, 2)
      );
    }
  }

  readSessions(): void {
    const sessions = fs.readdirSync(getSessionDir());
    for (const session of sessions) {
      const sessionData = fs.readFileSync(
        path.join(getSessionDir(), session),
        "utf8"
      );
      this.sessions.set(session.split(".")[0], JSON.parse(sessionData));
    }
  }

  async connect(config: RunConfig, client?: McpClientType): Promise<Session> {
    let daemonClient: DaemonRPCClient | undefined;
    try {
      daemonClient = await this.getDaemonClient();
      // start instance
      const instance = await daemonClient.startInstance(config);
      if (!instance) {
        throw new Error(`Failed to start instance: ${config}`);
      }

      // 세션 생성
      const session: Session = {
        id: uuidv4(),
        instanceId: instance.id,
        startedAt: new Date().toISOString(),
        status: SessionStatus.PENDING,
        instanceStatus: instance.status,
        connectionInfo: instance.connectionInfo,
        client,
      };

      this.sessions.set(session.id, session);
      this.writeSessions();

      if (instance.status === McpServerInstanceStatus.STARTING) {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            daemonClient?.dispose();
            reject(new Error("Timeout waiting for instance status"));
          }, 10000);

          daemonClient!.onInstanceStatusChange(async (instanceId, status) => {
            if (instanceId === instance.id) {
              const updatedSession: Session = {
                ...session,
              };
              if (status.status) {
                updatedSession.instanceStatus = status.status;
              }
              if (status.error) {
                updatedSession.error = status.error;
              }
              if (status.connectionInfo) {
                updatedSession.connectionInfo = status.connectionInfo;
              }
              if (status.status === McpServerInstanceStatus.RUNNING) {
                updatedSession.status = SessionStatus.CONNECTED;
                clearTimeout(timeout);
                resolve(updatedSession);
              }
              this.sessions.set(session.id, updatedSession);
              this.writeSessions();
            }
          });
        });
      }

      if (instance.status === McpServerInstanceStatus.RUNNING) {
        session.status = SessionStatus.CONNECTED;
        return session;
      }

      throw new Error(`Unexpected instance status: ${instance.status}`);
    } catch (error) {
      if (daemonClient) {
        daemonClient.dispose();
      }
      throw error;
    }
  }

  async disconnect(
    sessionId: string,
    killInstance: boolean = false
  ): Promise<void> {
    this.readSessions();
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    let daemonClient: DaemonRPCClient | undefined;
    try {
      daemonClient = await this.getDaemonClient();

      // 세션 상태 업데이트
      session.status = SessionStatus.DISCONNECTED;

      if (killInstance) {
        await daemonClient.stopInstance(session.instanceId);
      }

      // 세션 제거
      this.sessions.delete(sessionId);
      this.writeSessions();
    } catch (error) {
      this.logger.error("Failed to disconnect session:", error);
      throw error;
    } finally {
      if (daemonClient) {
        daemonClient.dispose();
      }
    }
  }

  async getStatus(sessionId: string): Promise<Session> {
    this.readSessions();
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    let daemonClient: DaemonRPCClient | undefined;
    try {
      daemonClient = await this.getDaemonClient();
      const instance = await daemonClient.getInstance(session.instanceId);
      if (!instance) {
        throw new Error(`Instance not found: ${session.instanceId}`);
      }

      const updatedSession: Session = {
        ...session,
        instanceStatus: instance.status,
        error: instance.error,
        connectionInfo: instance.connectionInfo,
      };

      if (instance.status === McpServerInstanceStatus.RUNNING) {
        updatedSession.status = SessionStatus.CONNECTED;
      } else if (
        instance.status === McpServerInstanceStatus.STOPPED ||
        instance.status === McpServerInstanceStatus.FAILED
      ) {
        updatedSession.status = SessionStatus.DISCONNECTED;
      }

      this.sessions.set(sessionId, updatedSession);
      this.writeSessions();

      return updatedSession;
    } catch (error) {
      this.logger.error("Failed to get status:", error);
      throw error;
    } finally {
      if (daemonClient) {
        daemonClient.dispose();
      }
    }
  }
  async listSessions(): Promise<Session[]> {
    this.readSessions();
    return Array.from(this.sessions.values());
  }

  async listClientSessions(client: McpClientType): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.client === client
    );
  }
}

export const newSessionManager = (logger: Logger): SessionManager => {
  return new DefaultSessionManager(logger);
};
