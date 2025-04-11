
type Profile = {
  name: string;
  installedMcpServers: any[]; // TODO: define type
  authentication: {[mcpServerKey: string]: any}; // TODO: define type
}

const defaultProfile: Profile = {
  name: "default",
  installedMcpServers: [],
  authentication: {},
}

export {
  defaultProfile, Profile
};


