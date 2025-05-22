import { ServiceTemplateFactory } from '.';

// systemd user service unit template for Linux
export const linuxServiceTemplate: ServiceTemplateFactory = ({
  name,
  description,
  nodePath,
  entryScript,
  workingDirectory,
}) => `
[Unit]
Description=${description}
After=network.target

[Service]
Type=simple
ExecStart=${nodePath} ${entryScript}
Restart=always
Environment=NODE_ENV=production
WorkingDirectory=${workingDirectory}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
`;
