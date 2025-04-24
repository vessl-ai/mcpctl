import { App } from '../../app';

export const sessionListCommand = async (app: App, argv: string[]) => {
  console.log('Session list command');
  const sessionManager = app.getSessionManager();
  const sessions = await sessionManager.listSessions();
  console.log(sessions);
};
