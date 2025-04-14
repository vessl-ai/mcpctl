import { verboseLog } from '../client/core/lib/env';
import { BaseContainer, Container } from '../lib/container/container';
import { Logger, newConsoleLogger } from '../lib/logger/logger';
import { newServerInstanceManager, ServerInstanceManager } from './managers/server-instance/server-instance-manager';
import { newRunConfigStore, RunConfigStore } from './services/config/factory';
import { newOrchestrator } from './services/orchestrator/orchestrator';
import { Orchestrator } from './services/orchestrator/types';

export class DaemonApp {
  private container: Container;

  constructor() {
    this.container = new BaseContainer();
    this.initializeDependencies();
  }

  private initializeDependencies(): void {
    // 기본 의존성
    this.container.register<Logger>(
      "logger",
      newConsoleLogger({ showVerbose: verboseLog() })
    );

    // Worker 관리를 위한 Orchestrator
    this.container.register<Orchestrator>(
      "orchestrator",
      newOrchestrator()
    );

    // 실행 설정 저장소
    this.container.register<RunConfigStore>(
      "runConfigStore",
      newRunConfigStore()
    );

    // 서버 인스턴스 매니저
    this.container.register<ServerInstanceManager>(
      "instanceManager",
      newServerInstanceManager(
        this.container.get<Orchestrator>("orchestrator"),
        this.container.get<RunConfigStore>("runConfigStore"),
        this.container.get<Logger>("logger")
      )
    );
  }

  public getOrchestrator(): Orchestrator {
    return this.container.get<Orchestrator>("orchestrator");
  }

  public getInstanceManager(): ServerInstanceManager {
    return this.container.get<ServerInstanceManager>("instanceManager");
  }

  public getRunConfigStore(): RunConfigStore {
    return this.container.get<RunConfigStore>("runConfigStore");
  }
}

export const newDaemonApp = (): DaemonApp => {
  return new DaemonApp();
};
