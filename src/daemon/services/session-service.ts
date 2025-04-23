import { SecretService } from "../../client/core/services/secret/secret-service";
import { Logger } from "../../lib/logger/logger";
import { SessionConfig } from "../types/session";

export class SessionService {
  constructor(
    private readonly logger: Logger,
    private readonly secretService: SecretService
  ) {}

  async createSession(config: SessionConfig): Promise<void> {
    this.logger.info("Creating session", config);

    // Resolve secrets in daemon
    const resolvedEnv = await this.secretService.resolveEnv(
      config.profileName,
      config.env
    );

    // Use resolved env for the actual session
    // ... rest of the session creation logic ...
  }
}

export const newSessionService = (
  logger: Logger,
  secretService: SecretService
): SessionService => {
  return new SessionService(logger, secretService);
};
