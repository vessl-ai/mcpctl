import { ServerInstance, ServerRunSpec } from "../../../types/domain/server";
export namespace StartServer {
  export interface Request {
    runSpec: ServerRunSpec;
  }
  export const route = "/server/start";
  export const method = "POST";
  export interface Response {
    instance: ServerInstance;
  }
}
