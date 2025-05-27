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
# Add PATH for systemd service, otherwise npx/node/npm may not be found!
Environment=PATH=${process.env.PATH ? `${process.env.PATH}:` : ''}/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
WorkingDirectory=${workingDirectory}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
`;
