import { getPortPromise } from "portfinder";
import { Logger } from "../../../lib/logger/logger";

export interface PortService {
  allocatePort(): Promise<number>;
  releasePort(port: number): void;
}

class DefaultPortService implements PortService {
  private static instance: DefaultPortService;
  private allocatedPorts: Set<number>;
  private minPort: number;
  private maxPort: number;
  private logger: Logger;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;

  private constructor(logger: Logger) {
    this.allocatedPorts = new Set();
    this.minPort = 8000;
    this.maxPort = 9000;
    this.logger = logger.withContext("PortService");
  }

  public static getInstance(logger: Logger): DefaultPortService {
    if (!DefaultPortService.instance) {
      DefaultPortService.instance = new DefaultPortService(logger);
    }
    return DefaultPortService.instance;
  }

  async allocatePort(): Promise<number> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      this.logger.debug(
        `Attempting to allocate port (attempt ${attempt}/${this.MAX_RETRIES})`
      );

      try {
        const port = await getPortPromise({
          port: this.minPort,
          stopPort: this.maxPort,
          host: "localhost",
        });

        if (this.allocatedPorts.has(port)) {
          this.logger.warn(`Port ${port} is already allocated, retrying...`);
          await new Promise((resolve) =>
            setTimeout(resolve, this.RETRY_DELAY_MS)
          );
          continue;
        }

        this.allocatedPorts.add(port);
        this.logger.debug("Port allocated successfully", { port });
        return port;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Failed to allocate port (attempt ${attempt}/${this.MAX_RETRIES})`,
          { error }
        );

        if (attempt < this.MAX_RETRIES) {
          await new Promise((resolve) =>
            setTimeout(resolve, this.RETRY_DELAY_MS)
          );
        }
      }
    }

    this.logger.error("Failed to allocate port after all retries", {
      error: lastError,
    });
    throw new Error(
      `Failed to allocate port after ${this.MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }

  releasePort(port: number): void {
    this.logger.debug("Releasing port", { port });
    if (this.allocatedPorts.has(port)) {
      this.allocatedPorts.delete(port);
      this.logger.debug("Port released successfully", { port });
    } else {
      this.logger.warn("Attempted to release unallocated port", { port });
    }
  }
}

export const newPortService = (logger: Logger): PortService => {
  return DefaultPortService.getInstance(logger);
};
