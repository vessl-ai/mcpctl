#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getMcpctldServiceTemplate, SERVICE_COMMANDS, SERVICE_PATHS } from '../dist/service-templates.js';

// Exit if not installed globally
if (!process.env.npm_config_global) {
  console.log('mcpctl is designed to be installed globally. Please use -g flag.');
  process.exit(0);
}

const platform = os.platform();
const isRoot = process.getuid && process.getuid() === 0;

// Create log directories
function createLogDirectories() {
  const logDirs = {
    darwin: '/var/log/mcpctl',
    linux: '/var/log/mcpctl',
    win32: 'C:\\ProgramData\\mcpctl\\logs'
  };

  const logDir = logDirs[platform];
  if (!logDir) {
    console.error(`Unsupported platform: ${platform}`);
    process.exit(1);
  }

  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    // Set permissions on Unix systems
    if (platform !== 'win32') {
      fs.chmodSync(logDir, '755');
    }
    return logDir;
  } catch (error) {
    console.warn(`Warning: Could not create log directory: ${error.message}`);
    console.warn('You may need to run: sudo mkdir -p /var/log/mcpctl && sudo chmod 755 /var/log/mcpctl');
    return logDirs[platform];
  }
}

try {
  // Create log directories
  const logDir = createLogDirectories();

  // Setup daemon service for each OS
  if (isRoot) {
    const nodePath = platform === 'win32' ? process.execPath : execSync('which node').toString().trim();
    const daemonPath = platform === 'win32' ? 
      path.join(process.execPath, '../../lib/node_modules/mcpctl/dist/mcpctld.js') :
      '/usr/local/bin/mcpctld';

    const templateOptions = {
      nodePath,
      daemonPath,
      logDir,
    };

    const serviceContent = getMcpctldServiceTemplate(templateOptions);

    // For Windows, execute service creation command directly
    if (platform === 'win32') {
      execSync(serviceContent);
    } else {
      // For Unix systems, create service file
      const servicePath = SERVICE_PATHS[platform];
      fs.writeFileSync(servicePath, serviceContent);
      fs.chmodSync(servicePath, '644');

      // For Linux, reload systemctl and enable service
      if (platform === 'linux') {
        execSync(SERVICE_COMMANDS.linux.reload.join(' '));
        execSync(SERVICE_COMMANDS.linux.enable.join(' '));
      }
    }

    // Start the service
    const startCommand = SERVICE_COMMANDS[platform].start;
    execSync(startCommand.join(' '));
    console.log('MCP daemon service started successfully');
  } else {
    console.warn('Warning: Not running as root/administrator. Daemon service setup skipped.');
    console.warn('You may need to run: sudo mcpctl daemon start');
  }
} catch (error) {
  console.error('Error during post-install:', error);
  process.exit(1);
} 