import { ServiceTemplateFactory } from '.';

// NSSM command template for Windows (run in user session for user-level service)
export const win32ServiceTemplate: ServiceTemplateFactory = ({
  name,
  description,
  nodePath,
  entryScript,
  workingDirectory,
  logPath,
}) => `
nssm install ${name} ${nodePath} ${entryScript}
nssm set ${name} AppDirectory ${workingDirectory}
nssm set ${name} AppEnvironmentExtra NODE_ENV=production;PATH=${process.env.PATH ? `${process.env.PATH};` : ''}C:\\Program Files\\nodejs;C:\\Windows\\system32;C:\\Windows
nssm set ${name} AppStdout ${logPath}\mcpctl.log
nssm set ${name} AppStderr ${logPath}\mcpctl.log
nssm start ${name}
`;
