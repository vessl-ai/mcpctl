import { McpServerInstance, McpServerInstanceConfig } from "../../../lib/types/instance";


// Orchestrator interface that manages workers
export interface Orchestrator {
  // Get or create a worker with specific configuration
  getOrCreateServerInstance(config: McpServerInstanceConfig): Promise<McpServerInstance>;
  
  // Get an existing server instance if it exists
  getServerInstance(serverInstanceId: string): Promise<McpServerInstance | null>;
  
  // List all active workers
  listServerInstances(): Promise<McpServerInstance[]>;
  
  // Stop and remove a server instance
  removeServerInstance(serverInstanceId: string): Promise<void>;
  
  // Stop all workers
  stopAll(): Promise<void>;
}