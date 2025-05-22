export enum TransportType {
  Stdio = "stdio",
  Sse = "sse",
  StreamableHttp = "streamableHttp",
}

export interface Transport {
  type: TransportType;
  port?: number;
}
