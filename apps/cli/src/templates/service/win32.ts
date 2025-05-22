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
nssm set ${name} AppEnvironmentExtra NODE_ENV=production
nssm set ${name} AppStdout ${logPath}\stdout.log
nssm set ${name} AppStderr ${logPath}\stderr.log
nssm start ${name}
`;
