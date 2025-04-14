import { Argument, Command } from "commander";
import { App } from "../../app";

const buildProfileEnvCommand = (app: App): Command => {
  const profileEnvCommand = new Command("env")
    .description("Set the environment variables for a profile")
    
    profileEnvCommand.command("set")
    .description("Set the environment variables for a profile")
    .addArgument(new Argument("name", "The name of the profile"))
    .requiredOption("-s, --server", "The server to set the environment variables for")
    .requiredOption("-e, --env <env...>", "The environment variables to set")
    .action(async ({ name, server, env }: { name: string, server: string, env: string[] }) => {
      const envPairs = env.map(e => e.split("="));
      const envRecord = Object.fromEntries(envPairs);
      app.getProfileService().setServerEnvForProfile(name, server, envRecord);
    });

    profileEnvCommand.command("get")
    .description("Get the environment variables for a profile")
    .addArgument(new Argument("name", "The name of the profile"))
    .requiredOption("-s, --server", "The server to get the environment variables for")
    .action(async ({ name, server }: { name: string, server: string }) => {
      const env = app.getProfileService().getProfile(name).servers[server].env;
      console.log(env);
    });
    
  return profileEnvCommand;
}

export { buildProfileEnvCommand };
