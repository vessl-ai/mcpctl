import { ServerType } from "../client/types";

type Profile = {
  name: string;
  servers: {
    [key: string]: {
      type: ServerType;
      command: string;
      args: string[];
      env: Record<string, string>;
    }
  }
}

const defaultProfile: Profile = {
  name: "default",
  servers: {},
}

export {
  defaultProfile, Profile
};


