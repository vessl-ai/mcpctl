import os from "os";
import path from "path";

// Service paths
const SERVICE_PATHS = {
  darwin: path.join(
    os.homedir(),
    "Library/LaunchAgents/com.mcpctl.daemon.plist"
  ),
  linux: path.join(os.homedir(), ".config/systemd/user/mcpctld.service"),
  win32: path.join(os.homedir(), "AppData/Local/mcpctl/mcpctld.service"),
} as const;

// Log paths
const LOG_PATHS = {
  darwin: path.join(os.homedir(), "Library/Logs/mcpctl"),
  linux: path.join(os.homedir(), ".local/share/mcpctl/logs"),
  win32: path.join(os.homedir(), "AppData/Local/mcpctl/logs"),
} as const;

// Socket paths
const SOCKET_PATHS = {
  darwin: "/tmp/mcp-daemon.sock",
  linux: "/tmp/mcp-daemon.sock",
  win32: "\\\\.\\pipe\\mcp-daemon",
} as const;

// Binary paths
const BINARY_PATHS = {
  darwin: "/usr/local/bin",
  linux: "/usr/local/bin",
  win32: path.join(os.homedir(), "AppData/Local/mcpctl/bin"),
} as const;

// Config paths
const CONFIG_PATHS = {
  darwin: path.join(os.homedir(), ".mcpctl/config"),
  linux: path.join(os.homedir(), ".mcpctl/config"),
  win32: path.join(os.homedir(), "AppData/Local/mcpctl/config"),
} as const;

// Client config paths
const CLIENT_CONFIG_PATHS = {
  cursor: {
    darwin: path.join(os.homedir(), ".cursor", "mcp.json"),
    linux: path.join(os.homedir(), ".cursor", "mcp.json"),
    win32: path.join(os.homedir(), ".cursor", "mcp.json"),
  },
  claude: {
    darwin: path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json"
    ),
    linux: path.join(
      os.homedir(),
      ".config",
      "claude",
      "claude_desktop_config.json"
    ),
    win32: path.join(
      os.homedir(),
      "AppData",
      "Claude",
      "claude_desktop_config.json"
    ),
  },
} as const;

export const Path = {
  SERVICE_PATHS,
  LOG_PATHS,
  SOCKET_PATHS,
  BINARY_PATHS,
  CONFIG_PATHS,
  CLIENT_CONFIG_PATHS,
};
