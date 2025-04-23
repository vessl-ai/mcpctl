import { spawn } from "child_process";
import { getPortPromise } from "portfinder";
import { Logger } from "../../../lib/logger/logger";
import { McpServerHostingType } from "../../../lib/types/hosting";
import { McpServerInstanceStatus } from "../../../lib/types/instance";
import { RunConfig } from "../../../lib/types/run-config";
import {
  BaseServerInstance,
  LocalServerInstance,
} from "./server-instance-impl";

jest.mock("child_process");
jest.mock("portfinder");
jest.mock("../../../lib/logger/logger");

describe("BaseServerInstance", () => {
  let config: RunConfig;
  let logger: Logger;

  beforeEach(() => {
    config = {
      hosting: McpServerHostingType.LOCAL,
      serverName: "test-server",
      profileName: "test-profile",
      command: "test-command",
      created: new Date().toISOString(),
    };
    logger = {
      verbose: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    };
  });

  class TestServerInstance extends BaseServerInstance {
    async start(): Promise<void> {}
    async stop(): Promise<void> {}
  }

  it("should initialize with correct values", () => {
    const instance = new TestServerInstance(config, logger);

    expect(instance.id).toBeDefined();
    expect(instance.status).toBe(McpServerInstanceStatus.STARTING);
    expect(instance.config).toBe(config);
    expect(instance.connectionInfo).toEqual({
      transport: "sse",
      baseUrl: "http://localhost:8000",
      port: 8000,
      endpoint: `/sse`,
    });
    expect(instance.startedAt).toBeDefined();
    expect(instance.lastUsedAt).toBeDefined();
  });
});

describe("LocalServerInstance", () => {
  let config: RunConfig;
  let logger: Logger;
  let mockProcess: any;
  let mockStdout: any;
  let mockStderr: any;

  beforeEach(() => {
    config = {
      hosting: McpServerHostingType.LOCAL,
      serverName: "test-server",
      profileName: "test-profile",
      command: "test-command",
      created: new Date().toISOString(),
    };
    logger = {
      verbose: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      withContext: jest.fn().mockReturnThis(),
    };

    // 프로세스 이벤트 리스너 제대로 모킹하기
    let stdoutBuffer = "";
    mockStdout = {
      on: jest.fn().mockImplementation((event, handler) => {
        if (event === "data") {
          mockStdout.handler = (chunk: Buffer) => {
            stdoutBuffer += chunk.toString("utf8");
            const lines = stdoutBuffer.split(/\r?\n/);
            stdoutBuffer = lines.pop() ?? "";

            lines.forEach((line) => {
              if (!line.trim()) return;
              try {
                const jsonMsg = JSON.parse(line);
                handler(Buffer.from(JSON.stringify(jsonMsg) + "\n"));
              } catch {
                handler(Buffer.from(line + "\n"));
              }
            });
          };
        }
      }),
      handler: null,
    };
    mockStderr = {
      on: jest.fn().mockImplementation((event, handler) => {
        if (event === "data") {
          mockStderr.handler = handler;
        }
      }),
      handler: null,
    };
    mockProcess = {
      kill: jest.fn(),
      stdout: mockStdout,
      stderr: mockStderr,
      on: jest.fn().mockImplementation((event, handler) => {
        if (event === "exit") {
          mockProcess.exitHandler = handler;
        }
      }),
      exitHandler: null,
    };
    (spawn as jest.Mock).mockReturnValue(mockProcess);
    (getPortPromise as jest.Mock).mockResolvedValue(12345);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should start process successfully", async () => {
    const instance = new LocalServerInstance(config, logger);
    await instance.start();

    expect(spawn).toHaveBeenCalledWith(
      "npx",
      [
        "-y",
        "supergateway",
        "--stdio",
        config.command,
        "--port",
        "12345",
        "--baseUrl",
        "http://localhost:12345",
        "--ssePath",
        "/sse",
        "--messagePath",
        "/message",
      ],
      {
        env: expect.anything(),
        stdio: ["pipe", "pipe", "pipe"],
        shell: false,
        windowsHide: true,
      }
    );

    // 프로세스 이벤트 리스너 설정 확인
    expect(mockProcess.on).toHaveBeenCalledWith("exit", expect.any(Function));
    expect(mockStdout.on).toHaveBeenCalledWith("data", expect.any(Function));

    expect(instance.status).toBe(McpServerInstanceStatus.RUNNING);
    expect(instance.connectionInfo.params).toEqual({
      port: 12345,
      baseUrl: "http://localhost:12345",
    });
    expect(instance.connectionInfo.endpoint).toBe("/sse");
    expect(instance.connectionInfo.transport).toBe("sse");
    expect(instance.connectionInfo.baseUrl).toBe("http://localhost:12345");
    expect(instance.connectionInfo.port).toBe(12345);
  });

  it("should handle start error", async () => {
    const error = new Error("Failed to start");
    (getPortPromise as jest.Mock).mockRejectedValue(error);

    const instance = new LocalServerInstance(config, logger);
    await expect(instance.start()).rejects.toThrow(error);

    expect(instance.status).toBe(McpServerInstanceStatus.FAILED);
    expect(instance.error).toBe(error);
  });

  it("should handle process messages", async () => {
    const instance = new LocalServerInstance(config, logger);
    await instance.start();

    // Clear any previous calls to logger
    jest.clearAllMocks();

    // JSON 메시지 테스트
    mockStdout.handler(Buffer.from('{"type":"test","data":"message"}\n'));
    expect(logger.info).toHaveBeenCalledWith("Worker stdout (JSON):", {
      message: { type: "test", data: "message" },
    });

    // 일반 텍스트 메시지
    mockStdout.handler(Buffer.from("test message\n"));
    expect(logger.info).toHaveBeenCalledWith("Worker stdout:", {
      message: "test message",
    });

    // stderr 메시지
    mockStderr.handler(Buffer.from("test error"));
    expect(logger.error).toHaveBeenCalledWith("Worker stderr:", {
      message: "test error",
    });
  });

  it("should stop process successfully", async () => {
    const instance = new LocalServerInstance(config, logger);
    await instance.start();

    // 프로세스 종료 시뮬레이션
    const exitHandler = mockProcess.on.mock.calls.find(
      (call: [string, Function]) => call[0] === "exit"
    )[1];

    await instance.stop();
    exitHandler(0); // 정상 종료 시뮬레이션

    expect(mockProcess.kill).toHaveBeenCalled();
    expect(instance.process).toBeUndefined();
    expect(instance.status).toBe(McpServerInstanceStatus.STOPPED);
  });

  it("should handle stop when process is not running", async () => {
    const instance = new LocalServerInstance(config, logger);
    await instance.stop();

    expect(instance.status).toBe(McpServerInstanceStatus.STOPPED);
  });

  it("should handle process error", async () => {
    const instance = new LocalServerInstance(config, logger);
    await instance.start();

    const error = new Error("Process error");
    instance.status = McpServerInstanceStatus.FAILED;
    instance.error = error;

    expect(instance.status).toBe(McpServerInstanceStatus.FAILED);
    expect(instance.error).toBe(error);
  });
});
