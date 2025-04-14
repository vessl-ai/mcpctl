import { RegistryEntry } from "../../../client/core/lib/types/registry";

// Worker configuration
export interface WorkerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  registryEntry?: RegistryEntry;  // Optional for backward compatibility
  profile?: string;               // Optional for backward compatibility
}

// Connection information for a worker
export interface WorkerConnectionInfo {
  transport: "sse";
  endpoint: string;
  params?: Record<string, string>;
}

// Status of a worker instance
export type WorkerStatus = 'starting' | 'running' | 'stopping' | 'stopped' | 'failed';

// Worker interface that represents a running MCP server instance
export interface Worker {
  id: string;
  config: WorkerConfig;
  status: WorkerStatus;
  error?: Error;
  connectionInfo: WorkerConnectionInfo;
}

// Orchestrator interface that manages workers
export interface Orchestrator {
  // Get or create a worker with specific configuration
  getOrCreateWorker(config: WorkerConfig): Promise<Worker>;
  
  // Get an existing worker if it exists
  getWorker(workerId: string): Promise<Worker | null>;
  
  // List all active workers
  listWorkers(): Promise<Worker[]>;
  
  // Stop and remove a worker
  removeWorker(workerId: string): Promise<void>;
  
  // Stop all workers
  stopAll(): Promise<void>;
  
  // Legacy support
  getOrCreateWorkerLegacy(registryEntry: RegistryEntry, profile: string): Promise<Worker>;
}

// Factory to create the appropriate worker type based on hosting
export interface WorkerFactory {
  createWorker(config: WorkerConfig): Promise<Worker>;
} 