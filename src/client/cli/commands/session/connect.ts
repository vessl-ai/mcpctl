import { spawn } from "child_process";
import { Command } from "commander";
import { McpServerHostingType } from "../../../../lib/types/hosting";
import { App } from "../../app";
const buildSessionConnectCommand = (app: App): Command => {
  const connectCommand = new Command("connect")
    .description("Connect to MCP server")
    .requiredOption("-s, --server <server>", "Server name")
    .option("-p, --profile <profile>", "Profile name")
    .requiredOption("-c, --command <command>", "Command to run");

  connectCommand.action(async (options) => {
    console.log("Connect command", options);
    const sessionManager = app.getSessionManager();
    const session = await sessionManager.connect({
      hosting: McpServerHostingType.LOCAL, // TODO: Make this configurable
      serverName: options.server,
      profileName: options.profile || "default",
      command: options.command,
      created: new Date().toISOString(),
    });
    console.log("Session created", session);

    const connectionUrl = `${session.connectionInfo.baseUrl}${session.connectionInfo.endpoint}`;

    console.log("Connecting to", connectionUrl);

    const child = spawn(`npx`, ["-y", "supergateway", "--sse", connectionUrl], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    child.on("exit", (code, signal) => {
      console.log(
        `Child process exited with code ${code} and signal ${signal}`
      );
    });

    child.on("error", (error) => {
      console.error("Child process error", error);
    });

    process.on("SIGINT", () => {
      child.kill();
    });
    process.on("SIGTERM", () => {
      child.kill();
    });
    child.stdout!.pipe(process.stdout);
    child.stderr!.pipe(process.stderr);
    process.stdin.pipe(child.stdin!);
  });

  return connectCommand;
};

export { buildSessionConnectCommand };
