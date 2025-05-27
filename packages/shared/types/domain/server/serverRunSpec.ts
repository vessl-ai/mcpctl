import { Transport } from "../../common/transport";
import { SecretRef } from "../secret";
export interface ServerRunSpec {
  id?: string;
  name: string;
  resourceType: "local" | "remote";
  transport: Transport;
  command: string;
  env?: Record<string, string>;
  secrets?: Record<string, SecretRef>;
}
