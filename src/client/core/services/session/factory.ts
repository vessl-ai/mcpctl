import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../../../lib/logger/logger';
import { Session } from '../../lib/types/session';

export interface SessionManager {
  // Worker에 연결
  connect(instanceId: string, clientId: string): Promise<Session>;

  // 연결 해제
  disconnect(sessionId: string): Promise<void>;

  // 현재 연결 상태 조회
  getStatus(sessionId: string): Promise<Session>;

  // 현재 활성 세션 목록
  listSessions(): Promise<Session[]>;

  // 특정 클라이언트의 세션 목록
  listClientSessions(clientId: string): Promise<Session[]>;
} 

class DefaultSessionManager implements SessionManager {
  private sessions: Map<string, Session>;

  constructor(
    private logger: Logger,
    private daemonClient: any  // TODO: 데몬 클라이언트 타입 정의 필요
  ) {
    this.sessions = new Map();
  }

  async connect(instanceId: string, clientId: string): Promise<Session> {
    try {
      // 데몬에서 인스턴스 정보 조회
      const instance = await this.daemonClient.getInstance(instanceId);
      if (!instance) {
        throw new Error(`Instance not found: ${instanceId}`);
      }

      // 세션 생성
      const session: Session = {
        id: uuidv4(),
        instanceId,
        clientId,
        startedAt: new Date().toISOString(),
        status: 'connected',
        connectionInfo: instance.connectionInfo
      };

      // 세션 저장
      this.sessions.set(session.id, session);

      return session;
    } catch (error) {
      this.logger.error('Failed to connect to instance:', error);
      throw error;
    }
  }

  async disconnect(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    try {
      // 세션 상태 업데이트
      session.status = 'disconnected';
      
      // 세션 제거
      this.sessions.delete(sessionId);
    } catch (error) {
      this.logger.error('Failed to disconnect session:', error);
      throw error;
    }
  }

  async getStatus(sessionId: string): Promise<Session> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }
    return session;
  }

  async listSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async listClientSessions(clientId: string): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.clientId === clientId);
  }
}

export const newSessionManager = (
  logger: Logger,
  daemonClient: any  // TODO: 데몬 클라이언트 타입 정의 필요
): SessionManager => {
  return new DefaultSessionManager(logger, daemonClient);
}; 