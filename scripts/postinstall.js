#!/usr/bin/env node

const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { exec } = require('@expo/sudo-prompt');
const { getMcpctldServiceTemplate, SERVICE_COMMANDS } = require('../dist/service-templates.js');
const { LOG_PATHS, SERVICE_PATHS } = require('../dist/constants/paths.js');

// Exit if not installed globally
if (!process.env.npm_config_global) {
  console.log('mcpctl is designed to be installed globally. Please use -g flag.');
  process.exit(0);
}

// Rebuild keytar with more robust approach
console.log('Rebuilding keytar...');
try {
  // First try the standard rebuild
  try {
    execSync('npm rebuild keytar', { stdio: 'inherit' });
  } catch (rebuildError) {
    console.warn('Standard rebuild failed, trying alternative approach...');
    
    // Try to force reinstall
    try {
      // Remove the module first
      execSync('npm uninstall keytar', { stdio: 'inherit' });
      // Then reinstall it
      execSync('npm install keytar@7.9.0 --save-exact', { stdio: 'inherit' });
    } catch (reinstallError) {
      console.error('Error: Failed to rebuild keytar. Secret management is required for mcpctl to function properly.');
      console.error('Please make sure you have the necessary build tools installed:');
      console.error('- On macOS: Xcode Command Line Tools');
      console.error('- On Linux: build-essential, python, and node-gyp');
      console.error('- On Windows: Visual Studio Build Tools');
      console.error('');
      console.error('You can try manually rebuilding keytar with:');
      console.error('npm rebuild keytar --update-binary');
      process.exit(1);
    }
  }
  
  // Verify keytar is working
  try {
    const keytar = require('keytar');
    if (typeof keytar.setPassword !== 'function') {
      throw new Error('keytar.setPassword is not a function');
    }
    console.log('✅ keytar successfully rebuilt and verified');
  } catch (verifyError) {
    console.error('Error: keytar verification failed. The module was rebuilt but appears to be incompatible.');
    console.error('This might be due to Node.js version incompatibility or missing system libraries.');
    console.error('Please try:');
    console.error('1. Updating Node.js to the latest LTS version');
    console.error('2. Installing system build tools');
    console.error('3. Running: npm rebuild keytar --update-binary');
    process.exit(1);
  }
} catch (error) {
  console.error('Error: Failed to rebuild keytar. Secret management is required for mcpctl to function properly.');
  console.error('Please make sure you have the necessary build tools installed:');
  console.error('- On macOS: Xcode Command Line Tools');
  console.error('- On Linux: build-essential, python, and node-gyp');
  console.error('- On Windows: Visual Studio Build Tools');
  process.exit(1);
}

const platform = os.platform();

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

// Function to execute all commands in a single batch with sudo
async function executeAllCommands(commands) {
  if (commands.length === 0) return;
  
  // Create a shell script with all commands
  const scriptContent = commands.join('\n');
  const scriptPath = path.join(os.tmpdir(), `mcpctl-sudo-${Date.now()}.sh`);
  
  try {
    // Write the script to a temporary file
    fs.writeFileSync(scriptPath, scriptContent);
    fs.chmodSync(scriptPath, '755');
    
    // Execute the script with sudo
    await executeWithSudo(`bash ${scriptPath}`);
  } catch (error) {
    console.error('Error executing commands:', error);
    throw error;
  } finally {
    // Clean up the temporary script
    try {
      fs.unlinkSync(scriptPath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Check if a process is running
function isProcessRunning(processName) {
  try {
    if (platform === 'win32') {
      const result = execSync(`tasklist /FI "IMAGENAME eq ${processName}" /NH`).toString();
      return result.includes(processName);
    } else {
      const result = execSync(`pgrep -f ${processName}`).toString();
      return result.trim().length > 0;
    }
  } catch (error) {
    // If pgrep returns non-zero exit code, process is not running
    return false;
  }
}

// Build the complete set of commands to execute
function buildCommandSet() {
  const commands = [];
  
  // Define log directories
  const logDir = LOG_PATHS[platform];
  if (!logDir) {
    console.error(`Unsupported platform: ${platform}`);
    process.exit(1);
  }
  
  // Add log directory creation commands
  if (platform !== 'win32') {
    commands.push(`mkdir -p ${logDir}`);
    commands.push(`chmod 755 ${logDir}`);
  }
  
  // Get paths
  let daemonPath, mcpctlPath;
  try {
    daemonPath = platform === 'win32' ? 
      execSync('where mcpctld').toString().trim() :
      execSync('which mcpctld').toString().trim();
  } catch (error) {
    console.warn('Warning: Could not find mcpctld path. The daemon may not start properly.');
    daemonPath = platform === 'win32' ? 'mcpctld' : path.join(BINARY_PATHS[platform], 'mcpctld');
  }
  
  try {
    mcpctlPath = platform === 'win32' ? 
      execSync('where mcpctl').toString().trim() :
      execSync('which mcpctl').toString().trim();
  } catch (error) {
    console.warn('Warning: Could not find mcpctl path. The daemon may not start properly.');
    mcpctlPath = platform === 'win32' ? 'mcpctl' : path.join(BINARY_PATHS[platform], 'mcpctl');
  }
  
  // Get node path
  const nodePath = platform === 'win32' ? process.execPath : execSync('which node').toString().trim();
  
  // Generate service template
  const templateOptions = {
    nodePath,
    daemonPath,
    logDir,
  };
  
  const serviceContent = getMcpctldServiceTemplate(templateOptions);
  
  // Check if daemon is running
  let daemonRunning = false;
  try {
    daemonRunning = isProcessRunning('mcpctld');
  } catch (error) {
    console.warn('Warning: Could not check if daemon is running. Continuing anyway.');
  }
  
  // Add daemon stop command if running
  if (daemonRunning) {
    console.log('[sudo] Stopping already running MCP daemon service...');
    commands.push(`${mcpctlPath} daemon stop`);
  }
  
  // Add service file creation commands
  if (platform !== 'win32') {
    const servicePath = SERVICE_PATHS[platform];
    commands.push(`echo '${serviceContent}' > ${servicePath}`);
    commands.push(`chmod 644 ${servicePath}`);
    
    // Add Linux-specific commands
    if (platform === 'linux') {
      commands.push(SERVICE_COMMANDS.linux.reload.join(' '));
      commands.push(SERVICE_COMMANDS.linux.enable.join(' '));
    }
  } else {
    // For Windows, we'll execute the service content directly
    commands.push(serviceContent);
  }
  
  // Add service start command
  const startCommand = SERVICE_COMMANDS[platform].start;
  commands.push(startCommand.join(' '));
  
  return commands;
}

// Main execution
async function main() {
  try {
    // Build the complete command set
    const commands = buildCommandSet();
    
    // Execute all commands with sudo
    console.log('Requesting sudo privileges for service setup...');
    await executeAllCommands(commands);
    
    console.log('MCP daemon service setup completed successfully');
  } catch (error) {
    console.error('Error during service setup:', error);
    console.warn('You may need to run: sudo mcpctl daemon start');
  }
}

// Run the main function
main(); 