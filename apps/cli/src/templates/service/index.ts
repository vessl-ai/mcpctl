import { darwinServiceTemplate } from './darwin';
import { linuxServiceTemplate } from './linux';
import { win32ServiceTemplate } from './win32';

export interface ServiceTemplateOptions {
  name: string;
  description: string;
  nodePath: string;
  entryScript: string;
  workingDirectory: string;
  logPath: string;
}

export type ServiceTemplateFactory = ({
  name,
  description,
  nodePath,
  entryScript,
  workingDirectory,
}: ServiceTemplateOptions) => string;

export const getServiceTemplate = (): ServiceTemplateFactory => {
  const os = process.platform;
  if (os === 'linux') {
    return linuxServiceTemplate;
  }
  if (os === 'darwin') {
    return darwinServiceTemplate;
  }
  if (os === 'win32') {
    return win32ServiceTemplate;
  }
  throw new Error(`Unsupported OS: ${os}`);
};
