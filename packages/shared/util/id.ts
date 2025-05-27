import { randomUUID } from "crypto";
import { ServerIdPrefix } from "../constants/id-prefix";
export const generateId = (prefix: string) => {
  return `${prefix}_${randomUUID()}`;
};

export const generateServerInstanceId = () => {
  return generateId(ServerIdPrefix.INSTANCE);
};

export const generateServerRunSpecId = () => {
  return generateId(ServerIdPrefix.RUN_SPEC);
};
