import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execSync, spawnSync } from 'child_process';
import { mkdirSync, unlinkSync, writeFileSync } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { AppConfig } from '../config/app.config';
import { getServiceTemplate } from '../templates/service';
@Injectable()
export class OsServiceService {
  SERVICE_NAME = 'mcpctl-control-plane';

  constructor(private readonly configService: ConfigService) {}

  private getServiceFile() {
    switch (process.platform) {
      case 'linux':
        return path.join(
          os.homedir(),
          '.config/systemd/user',
          `${this.SERVICE_NAME}.service`,
        );
      case 'darwin':
        return path.join(
          os.homedir(),
          'Library/LaunchAgents',
          `${this.SERVICE_NAME}.plist`,
        );
      case 'win32':
        return path.join(
          os.homedir(),
          'AppData/Roaming/nssm',
          `${this.SERVICE_NAME}.exe`,
        );
      default:
        throw new Error(`Unsupported platform: ${process.platform}`);
    }
  }

  async launchAsOsService() {
    const name = this.SERVICE_NAME;
    const description = 'mcpctl control plane';
    const nodePath = spawnSync('which', ['node']).stdout.toString().trim();
    const entryScript = path.join(
      __dirname,
      '..',
      '..',
      'dist',
      'templates',
      'control-plane',
      'entrypoint.js',
    );
    const workingDirectory = process.cwd();
    const appConfig = this.configService.get<AppConfig>('app')!;
    const logPath = appConfig.controlPlaneLogPath;
    const serviceTemplateFactory = getServiceTemplate();
    const serviceTemplate = serviceTemplateFactory({
      name: this.SERVICE_NAME,
      description,
      nodePath,
      entryScript,
      workingDirectory,
      logPath,
    });

    switch (process.platform) {
      case 'linux': {
        // systemd user service
        const serviceFile = this.getServiceFile();
        mkdirSync(path.dirname(serviceFile), { recursive: true });
        writeFileSync(serviceFile, serviceTemplate);
        execSync('systemctl --user daemon-reload');
        execSync(`systemctl --user enable ${name}`);
        execSync(`systemctl --user start ${name}`);
        console.log(`User-level systemd service registered: ${serviceFile}`);
        break;
      }
      case 'darwin': {
        // launchd user agent
        const plistFile = this.getServiceFile();
        mkdirSync(path.dirname(plistFile), { recursive: true });
        writeFileSync(plistFile, serviceTemplate);
        execSync(`launchctl load ${plistFile}`);
        execSync(`launchctl start ${name}`);
        console.log(`User-level launchd agent registered: ${plistFile}`);
        break;
      }
      case 'win32': {
        // NSSM user-level service
        execSync(`nssm install ${name} ${nodePath} ${entryScript}`);
        execSync(`nssm set ${name} AppDirectory ${workingDirectory}`);
        execSync(`nssm set ${name} AppEnvironmentExtra NODE_ENV=production`);
        execSync(`nssm set ${name} AppStdout ${path.join(logPath, 'stdout.log')}`);
        execSync(`nssm set ${name} AppStderr ${path.join(logPath, 'stderr.log')}`);
        execSync(`nssm start ${name}`);
        console.log(`User-level NSSM service registered: ${name}`);
        break;
      }
      default:
        throw new Error(`Unsupported platform: ${process.platform}`);
    }
  }

  async stopService() {
    const name = this.SERVICE_NAME;
    switch (process.platform) {
      case 'linux': {
        // systemd user service stop
        try {
          execSync(`systemctl --user stop ${name}`);
          execSync(`systemctl --user disable ${name}`);
          execSync(`systemctl --user daemon-reload`);
          const serviceFile = this.getServiceFile();
          unlinkSync(serviceFile);
          console.log(`User-level systemd service stopped: ${name}`);
        } catch (err) {
          console.error(`Failed to stop systemd user service: ${err}`);
        }
        break;
      }
      case 'darwin': {
        // launchd user agent stop
        try {
          execSync(`launchctl stop ${name}`);
          const plistFile = this.getServiceFile();
          execSync(`launchctl unload ${plistFile}`);
          unlinkSync(plistFile);
          console.log(`User-level launchd agent stopped: ${name}`);
        } catch (err) {
          console.error(`Failed to stop launchd agent: ${err}`);
        }
        break;
      }
      case 'win32': {
        // NSSM user-level service stop
        try {
          execSync(`nssm stop ${name}`);
          console.log(`User-level NSSM service stopped: ${name}`);
        } catch (err) {
          console.error(`Failed to stop NSSM service: ${err}`);
        }
        break;
      }
      default:
        throw new Error(`Unsupported platform: ${process.platform}`);
    }
  }

  async getServiceStatus() {
    switch (process.platform) {
      case 'linux': {
        // systemd user service status
        try {
          execSync(`systemctl --user status ${this.SERVICE_NAME}`);
        } catch (err) {
          console.error(`Failed to get systemd user service status: ${err}`);
        }
        break;
      }
      case 'darwin': {
        // launchd user agent status
        try {
          execSync(`launchctl list | grep ${this.SERVICE_NAME}`);
        } catch (err) {
          console.error(`Failed to get launchd agent status: ${err}`);
        }
        break;
      }
      case 'win32': {
        // NSSM user-level service status
        try {
          execSync(`nssm status ${this.SERVICE_NAME}`);
        } catch (err) {
          console.error(`Failed to get NSSM service status: ${err}`);
        }
        break;
      }
      default:
        throw new Error(`Unsupported platform: ${process.platform}`);
    }
  }
}
