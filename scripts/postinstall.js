#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { exec } = require('@expo/sudo-prompt');
const { getMcpctldServiceTemplate, SERVICE_PATHS, SERVICE_COMMANDS } = require('../dist/service-templates.js');

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

// Function to execute commands with sudo
async function executeWithSudo(command) {
  return new Promise((resolve, reject) => {
    exec(command, { name: 'mcpctl' }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function setupService() {
  try {
    // Create log directories
    const logDir = createLogDirectories();

    // Setup daemon service for each OS
    const nodePath = platform === 'win32' ? process.execPath : execSync('which node').toString().trim();
    const daemonPath = platform === 'win32' ? 
      execSync('where mcpctld').toString().trim() :
      execSync('which mcpctld').toString().trim();
    const mcpctlPath = platform === 'win32' ? 
      execSync('where mcpctl').toString().trim() :
      execSync('which mcpctl').toString().trim();

    const templateOptions = {
      nodePath,
      daemonPath,
      logDir,
    };

    const serviceContent = getMcpctldServiceTemplate(templateOptions);

    // if daemon is running, stop service
    if (execSync('pgrep -f mcpctld').toString().trim()) {
      console.log('[sudo] Stopping already running MCP daemon service...');
      await executeWithSudo(`${mcpctlPath} daemon stop`);
    }

    // For Windows, execute service creation command directly
    if (platform === 'win32') {
      execSync(serviceContent);
    } else {
      // For Unix systems, create service file
      const servicePath = SERVICE_PATHS[platform];
      
      if (isRoot) {
        fs.writeFileSync(servicePath, serviceContent);
        fs.chmodSync(servicePath, '644');
      } else {
        // Use sudo to write the service file
        await executeWithSudo(`echo '${serviceContent}' > ${servicePath}`);
        await executeWithSudo(`chmod 644 ${servicePath}`);
      }

      // For Linux, reload systemctl and enable service
      if (platform === 'linux') {
        if (isRoot) {
          execSync(SERVICE_COMMANDS.linux.reload.join(' '));
          execSync(SERVICE_COMMANDS.linux.enable.join(' '));
        } else {
          await executeWithSudo(SERVICE_COMMANDS.linux.reload.join(' '));
          await executeWithSudo(SERVICE_COMMANDS.linux.enable.join(' '));
        }
      }
    }

    // Start the service
    const startCommand = SERVICE_COMMANDS[platform].start;
    if (isRoot) {
      execSync(startCommand.join(' '));
    } else {
      await executeWithSudo(startCommand.join(' '));
    }
    console.log('MCP daemon service started successfully');
  } catch (error) {
    console.error('Error during service setup:', error);
    process.exit(1);
  }
}

// Main execution
if (isRoot) {
  setupService();
} else {
  console.log('Requesting sudo privileges for service setup...');
  setupService().catch(error => {
    console.error('Failed to acquire sudo privileges:', error);
    console.warn('You may need to run: sudo mcpctl daemon start');
    process.exit(1);
  });
} 