import { ServiceTemplateFactory } from '.';

// launchd user agent plist template for macOS (place in ~/Library/LaunchAgents/)
export const darwinServiceTemplate: ServiceTemplateFactory = ({
  name,
  description,
  nodePath,
  entryScript,
  workingDirectory,
  logPath,
}) => `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${name}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${entryScript}</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>${workingDirectory}</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <!-- Add PATH for launchd, otherwise npx/node/npm will not be found! -->
        <key>PATH</key>
        <string>${process.env.PATH ? `${process.env.PATH}:` : ''}/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
    <key>StandardOutPath</key>
    <string>${logPath}/mcpctl.log</string>
    <key>StandardErrorPath</key>
    <string>${logPath}/mcpctl.log</string>
</dict>
</plist>
`;
