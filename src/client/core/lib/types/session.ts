export interface Session {
  id: string;
  instanceId: string;
  clientId: string;
  startedAt: string;
  status: "connected" | "disconnected";
  connectionInfo: any; // Worker의 연결 정보
  error?: Error;
}
