import { v4 as uuidv4 } from 'uuid';

import { RunConfig } from '../../../lib/types/run-config';
export interface RunConfigStore {
  // 설정 저장
  saveConfig(config: Omit<RunConfig, "id">): Promise<string>;

  // 설정 조회
  getConfig(id: string): Promise<RunConfig | null>;

  // 프로필과 서버로 설정 검색
  findConfig(
    profileName: string,
    serverName: string
  ): Promise<RunConfig | null>;

  // 설정 업데이트
  updateConfig(id: string, config: Partial<RunConfig>): Promise<void>;

  // 설정 삭제
  deleteConfig(id: string): Promise<void>;

  // 모든 설정 조회
  listConfigs(): Promise<RunConfig[]>;
} 

class InMemoryRunConfigStore implements RunConfigStore {
  private configs: Map<string, RunConfig>;

  constructor() {
    this.configs = new Map();
  }

  async saveConfig(config: Omit<RunConfig, 'id'>): Promise<string> {
    const id = uuidv4();
    const fullConfig: RunConfig = {
      ...config,
      id,
      created: new Date().toISOString()
    };
    
    this.configs.set(id, fullConfig);
    return id;
  }

  async getConfig(id: string): Promise<RunConfig | null> {
    return this.configs.get(id) || null;
  }

  async findConfig(profileName: string, serverName: string): Promise<RunConfig | null> {
    for (const config of this.configs.values()) {
      if (config.profileName === profileName && config.serverName === serverName) {
        return config;
      }
    }
    return null;
  }

  async updateConfig(id: string, config: Partial<RunConfig>): Promise<void> {
    const existing = this.configs.get(id);
    if (!existing) {
      throw new Error(`Config not found: ${id}`);
    }

    this.configs.set(id, {
      ...existing,
      ...config,
      id  // ID는 변경 불가
    });
  }

  async deleteConfig(id: string): Promise<void> {
    this.configs.delete(id);
  }

  async listConfigs(): Promise<RunConfig[]> {
    return Array.from(this.configs.values());
  }
}

export const newRunConfigStore = (): RunConfigStore => {
  return new InMemoryRunConfigStore();
}; 