import {
  Logger,
  McpClientType,
  McpServerInstanceStatus,
  RunConfig,
} from "@mcpctl/lib";
import fs from "fs";
import path from "path";
import { getSessionDir } from "../../lib/env";
import { DaemonRPCClient } from "../../lib/rpc/client";
import { newSession, Session, SessionStatus } from "../../lib/types/session";

export interface SessionManager {
  // Connect to instance
  connect(config: RunConfig, client?: McpClientType): Promise<Session>;

  // Disconnect from instance
  disconnect(sessionId: string, killInstance: boolean): Promise<void>;

  // Get current connection status
  getStatus(sessionId: string): Promise<Session>;

  // List all active sessions
  listSessions(): Promise<Session[]>;

  // List sessions for a specific client
  listClientSessions(clientId: string): Promise<Session[]>;
}

export class DefaultSessionManager implements SessionManager {
  private sessions: Map<string, Session>; // TODO: store in sqlite? or file

  constructor(private logger: Logger) {
    this.sessions = new Map();
  }

  async getDaemonClient(): Promise<DaemonRPCClient> {
    try {
      this.logger.debug("Attempting to get daemon RPC client instance");
      const client = await DaemonRPCClient.getInstance(this.logger);
      this.logger.debug("Successfully obtained daemon RPC client");
      return client;
    } catch (error) {
      this.logger.error("Failed to get daemon RPC client", {
        error: error instanceof Error ? error.stack : String(error),
        errorCode: (error as any)?.code,
        errorType: error?.constructor?.name,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  writeSessions(): void {
    this.logger.debug("Writing sessions to disk", {
      sessionCount: this.sessions.size,
      sessionDir: getSessionDir(),
    });

    if (!fs.existsSync(getSessionDir())) {
      this.logger.info("Creating session directory", { dir: getSessionDir() });
      fs.mkdirSync(getSessionDir(), { recursive: true });
    }

    for (const session of Array.from(this.sessions.values())) {
      const sessionPath = path.join(getSessionDir(), `${session.id}.json`);
      this.logger.debug("Writing session file", {
        sessionId: session.id,
        path: sessionPath,
        status: session.status,
        instanceId: session.instanceId,
      });
      fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
    }

    // Delete session files that are not in memory
    const sessionFiles = fs.readdirSync(getSessionDir());
    this.logger.debug("Checking for orphaned session files", {
      filesFound: sessionFiles.length,
      activeSessions: this.sessions.size,
    });

    for (const sessionFile of sessionFiles) {
      const sessionId = sessionFile.split(".")[0];
      if (!this.sessions.has(sessionId)) {
        this.logger.warn("Deleting orphaned session file", {
          sessionFile,
          sessionId,
          reason: "Session not found in memory",
        });
        fs.unlinkSync(path.join(getSessionDir(), sessionFile));
      }
    }
  }

  readSessions(): void {
    this.logger.debug("Reading sessions from disk", { dir: getSessionDir() });
    const sessions = fs.readdirSync(getSessionDir());
    this.logger.info("Found session files", { count: sessions.length });

    for (const session of sessions) {
      const sessionPath = path.join(getSessionDir(), session);
      try {
        const sessionData = fs.readFileSync(sessionPath, "utf8");
        const parsedSession = JSON.parse(sessionData);
        this.logger.debug("Loaded session from disk", {
          sessionId: parsedSession.id,
          status: parsedSession.status,
          instanceId: parsedSession.instanceId,
        });
        this.sessions.set(session.split(".")[0], parsedSession);
      } catch (error) {
        this.logger.error("Failed to read session file", {
          sessionFile: session,
          error: error instanceof Error ? error.message : String(error),
          path: sessionPath,
        });
      }
    }
  }

  async connect(config: RunConfig, client?: McpClientType): Promise<Session> {
    const startTime = new Date().toISOString();
    this.logger.info("Starting new session connection", {
      config,
      client,
      startTime,
      configEnv: Object.keys(config.env || {}),
      configSecrets: Object.keys(config.secrets || {}),
    });

    let daemonClient: DaemonRPCClient | undefined;
    let rpcAttempts = 0;
    const MAX_RPC_ATTEMPTS = 3;

    try {
      while (rpcAttempts < MAX_RPC_ATTEMPTS) {
        try {
          this.logger.debug("Initializing daemon connection", {
            attempt: rpcAttempts + 1,
            maxAttempts: MAX_RPC_ATTEMPTS,
          });
          daemonClient = await this.getDaemonClient();
          break;
        } catch (error) {
          rpcAttempts++;
          this.logger.error("RPC connection attempt failed", {
            attempt: rpcAttempts,
            maxAttempts: MAX_RPC_ATTEMPTS,
            error: error instanceof Error ? error.stack : String(error),
            errorCode: (error as any)?.code,
            syscall: (error as any)?.syscall,
            errno: (error as any)?.errno,
          });

          if (rpcAttempts === MAX_RPC_ATTEMPTS) {
            throw new Error(
              `Failed to establish RPC connection after ${MAX_RPC_ATTEMPTS} attempts`
            );
          }
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      this.logger.info("Starting instance with config", {
        config: {
          ...config,
          secrets: Object.keys(config.secrets || {}), // Don't log secret values
        },
        timestamp: new Date().toISOString(),
        rpcClientStatus: daemonClient ? "connected" : "undefined",
      });

      const instance = await daemonClient!
        .startInstance(config)
        .catch((error) => {
          this.logger.error("Failed to start instance via RPC", {
            error: error instanceof Error ? error.stack : String(error),
            errorCode: (error as any)?.code,
            errorType: error?.constructor?.name,
            rpcError: (error as any)?.rpcError,
            config: {
              ...config,
              secrets: Object.keys(config.secrets || {}),
            },
          });
          throw error;
        });

      if (!instance) {
        this.logger.error("Instance creation failed", {
          config: {
            ...config,
            secrets: Object.keys(config.secrets || {}),
          },
          reason: "Daemon returned null instance",
          rpcClientStatus: daemonClient ? "connected" : "undefined",
        });
        throw new Error(
          `Failed to start instance: ${JSON.stringify({
            ...config,
            secrets: Object.keys(config.secrets || {}),
          })}`
        );
      }

      this.logger.info("Instance successfully started", {
        instanceId: instance.id,
        status: instance.status,
        connectionInfo: instance.connectionInfo,
        startupDuration: `${Date.now() - new Date(startTime).getTime()}ms`,
      });

      // Create new session
      const session = newSession({
        instanceId: instance.id,
        instanceStatus: instance.status,
        connectionInfo: instance.connectionInfo,
        client,
      });

      this.sessions.set(session.id, session);
      this.writeSessions();
      this.logger.info("Session created", {
        session: {
          ...session,
          connectionInfo: session.connectionInfo,
        },
      });

      if (instance.status === McpServerInstanceStatus.STARTING) {
        this.logger.info("Waiting for instance to become ready", {
          instanceId: instance.id,
          currentStatus: instance.status,
          timeout: "10000ms",
          startTime: new Date().toISOString(),
        });

        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            this.logger.error("Instance startup timeout", {
              instanceId: instance.id,
              lastKnownStatus: instance.status,
              timeoutMs: 10000,
              sessionId: session.id,
              startTime,
              endTime: new Date().toISOString(),
            });
            daemonClient?.dispose();
            reject(new Error("Timeout waiting for instance status"));
          }, 100000);

          daemonClient!.onInstanceStatusChange(async (instanceId, status) => {
            this.logger.debug("Instance status changed", {
              instanceId,
              previousStatus: instance.status,
              newStatus: status.status,
              statusChangeTime: new Date().toISOString(),
              error: status.error,
              connectionInfo: status.connectionInfo ? "present" : "absent",
            });
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
                daemonClient?.dispose();
                resolve(updatedSession);
              }
              this.sessions.set(session.id, updatedSession);
              this.writeSessions();
              this.logger.info("Session updated", { updatedSession });
            }
          });
        });
      }

      if (instance.status === McpServerInstanceStatus.RUNNING) {
        this.logger.debug("Instance is running, returning session", {
          instanceId: instance.id,
          sessionId: session.id,
          startupDuration: `${Date.now() - new Date(startTime).getTime()}ms`,
        });
        session.status = SessionStatus.CONNECTED;
        daemonClient?.dispose();
        return session;
      }

      const errorMsg = `Unexpected instance status: ${instance.status}`;
      this.logger.error(errorMsg, {
        instance,
        sessionId: session.id,
        startTime,
        endTime: new Date().toISOString(),
      });
      throw new Error(errorMsg);
    } catch (error) {
      const errorContext = {
        error: error instanceof Error ? error.stack : String(error),
        errorCode: (error as any)?.code,
        errorType: error?.constructor?.name,
        rpcError: (error as any)?.rpcError,
        syscall: (error as any)?.syscall,
        errno: (error as any)?.errno,
        config: {
          ...config,
          secrets: Object.keys(config.secrets || {}),
        },
        client,
        startTime,
        endTime: new Date().toISOString(),
        rpcAttempts,
        daemonClientStatus: daemonClient ? "present" : "absent",
      };

      this.logger.error("Session connection failed", errorContext);

      if (daemonClient) {
        try {
          this.logger.debug("Disposing daemon client after error");
          await daemonClient.dispose();
        } catch (disposeError) {
          this.logger.error("Failed to dispose daemon client", {
            error:
              disposeError instanceof Error
                ? disposeError.stack
                : String(disposeError),
            originalError: errorContext,
          });
        }
      }
      throw error;
    }
  }

  async disconnect(
    sessionId: string,
    killInstance: boolean = false
  ): Promise<void> {
    this.logger.info("Disconnecting session", {
      sessionId,
      killInstance,
      timestamp: new Date().toISOString(),
    });

    this.readSessions();
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.error("Session not found for disconnect", { sessionId });
      throw new Error(`Session not found: ${sessionId}`);
    }

    let daemonClient: DaemonRPCClient | undefined;
    try {
      this.logger.debug("Initializing daemon connection for disconnect");
      daemonClient = await this.getDaemonClient();

      this.logger.info("Updating session status to disconnected", {
        sessionId,
        previousStatus: session.status,
        instanceId: session.instanceId,
      });
      session.status = SessionStatus.DISCONNECTED;

      if (killInstance) {
        this.logger.info("Stopping instance", {
          instanceId: session.instanceId,
          sessionId,
        });
        await daemonClient.stopInstance(session.instanceId);
      }

      this.logger.info("Removing session", { sessionId });
      this.sessions.delete(sessionId);
      this.writeSessions();
    } catch (error) {
      this.logger.error("Failed to disconnect session", {
        sessionId,
        error: error instanceof Error ? error.stack : String(error),
        killInstance,
        timestamp: new Date().toISOString(),
      });
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
      this.logger.error("Failed to get status:", { error });
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
