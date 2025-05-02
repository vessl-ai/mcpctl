import os from "os";
import path from "path";
import { LOG_PATHS, SERVICE_PATHS } from "../constants/paths";

export interface ServiceTemplateOptions {
  nodePath: string;
  daemonPath: string;
  logDir: string;
}

export function getMcpctldServiceTemplate(
  options: ServiceTemplateOptions
): string {
  const platform = os.platform();

  switch (platform) {
    case "darwin":
      return getMacOSLaunchdTemplate(options);
    case "linux":
      return getLinuxSystemdTemplate(options);
    case "win32":
      return getWindowsServiceCommand(options);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

function getMacOSLaunchdTemplate(options: ServiceTemplateOptions): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mcpctl.daemon</string>
    <key>ProgramArguments</key>
    <array>
        <string>${options.nodePath}</string>
        <string>${options.daemonPath}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>${path.join(LOG_PATHS.darwin, "daemon.error.log")}</string>
    <key>StandardOutPath</key>
    <string>${path.join(LOG_PATHS.darwin, "daemon.log")}</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
    <key>UserName</key>
    <string>${process.env.USER}</string>
</dict>
</plist>`;
}

function getLinuxSystemdTemplate(options: ServiceTemplateOptions): string {
  return `[Unit]
Description=MCP Daemon Service
After=network.target

[Service]
ExecStart=${options.nodePath} ${options.daemonPath}
Restart=always
StandardOutput=append:${path.join(LOG_PATHS.linux, "daemon.log")}
StandardError=append:${path.join(LOG_PATHS.linux, "daemon.error.log")}

[Install]
WantedBy=default.target`;
}

function getWindowsServiceCommand(options: ServiceTemplateOptions): string {
  return `sc create mcpctld binPath= "${options.nodePath} ${options.daemonPath}" start= auto`;
}

export const SERVICE_COMMANDS = {
  darwin: {
    start: ["launchctl", "load", "-w", SERVICE_PATHS.darwin],
    stop: ["launchctl", "unload", "-w", SERVICE_PATHS.darwin],
  },
  linux: {
    start: ["systemctl", "--user", "start", "mcpctld"],
    stop: ["systemctl", "--user", "stop", "mcpctld"],
    reload: ["systemctl", "--user", "daemon-reload"],
    enable: ["systemctl", "--user", "enable", "mcpctld"],
  },
  win32: {
    start: ["net", "start", "mcpctld"],
    stop: ["net", "stop", "mcpctld"],
  },
} as const;
