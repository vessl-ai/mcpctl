import { newApp } from "./app";
import { buildDaemonCommand } from "./commands/daemon";
import { buildInstallCommand } from "./commands/install";
import { buildProfileCommand } from "./commands/profile";
import { buildRegistryCommand } from "./commands/registry";
import { buildSearchCommand } from "./commands/search";
import { buildServerCommand } from "./commands/server";
import { buildSessionCommand } from "./commands/session";

// 명령행 인자 파싱 함수
const parseArgs = (args: string[]) => {
  const options: Record<string, any> = {};
  const command: string[] = [];

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const [key, value] = arg.slice(2).split("=");
      options[key] = value || true;
    } else if (arg.startsWith("-")) {
      const key = arg.slice(1);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith("-")) {
        options[key] = nextArg;
        i++;
      } else {
        options[key] = true;
      }
    } else {
      command.push(arg);
    }
  }

  return { command, options };
};

// 명령어 실행 함수 타입 정의
type CommandExecutor = {
  action: (options: any) => Promise<void>;
};

const main = async () => {
  const app = newApp();
  await app.init();

  const { command, options } = parseArgs(process.argv);

  if (command.length === 0) {
    console.error("Error: No command specified.");
    console.error("\nAvailable commands:");
    console.error("  server\t\tManage MCP servers");
    console.error("  session\t\tManage MCP sessions");
    console.error("  install\t\tInstall MCP packages");
    console.error("  profile\t\tManage MCP profiles");
    console.error("  registry\t\tManage MCP registries");
    console.error("  search\t\tSearch for MCP packages");
    console.error("  daemon\t\tManage MCP daemon");
    console.error("\nFor detailed help: mcpctl <command> --help");
    process.exit(1);
  }

  const mainCommand = command[0];

  try {
    switch (mainCommand) {
      case "server": {
        const executor = buildServerCommand(app) as unknown as CommandExecutor;
        await executor.action({ ...options, args: command.slice(1) });
        break;
      }
      case "session": {
        const executor = buildSessionCommand(app) as unknown as CommandExecutor;
        await executor.action({ ...options, args: command.slice(1) });
        break;
      }
      case "install": {
        const executor = buildInstallCommand(app) as unknown as CommandExecutor;
        await executor.action({ ...options, args: command.slice(1) });
        break;
      }
      case "profile": {
        const executor = buildProfileCommand(app) as unknown as CommandExecutor;
        await executor.action({ ...options, args: command.slice(1) });
        break;
      }
      case "registry": {
        const executor = buildRegistryCommand(
          app
        ) as unknown as CommandExecutor;
        await executor.action({ ...options, args: command.slice(1) });
        break;
      }
      case "search": {
        const executor = buildSearchCommand(app) as unknown as CommandExecutor;
        await executor.action({ ...options, args: command.slice(1) });
        break;
      }
      case "daemon": {
        const executor = buildDaemonCommand(app) as unknown as CommandExecutor;
        await executor.action({ ...options, args: command.slice(1) });
        break;
      }
      default:
        console.error(`Error: '${mainCommand}' is an unknown command.`);
        console.error("\nAvailable commands:");
        console.error("  server\t\tManage MCP servers");
        console.error("  session\t\tManage MCP sessions");
        console.error("  install\t\tInstall MCP packages");
        console.error("  profile\t\tManage MCP profiles");
        console.error("  registry\t\tManage MCP registries");
        console.error("  search\t\tSearch for MCP packages");
        console.error("  daemon\t\tManage MCP daemon");
        console.error("\nFor detailed help: mcpctl <command> --help");
        process.exit(1);
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.error(
        "Daemon is not running, trying to start it by running `mcpctl daemon start`"
      );
    } else {
      console.error("\nAn error occurred. Use -v option for more details.");
      if (options.v || options.verbose) {
        console.error(error);
      }
    }
    process.exit(1);
  }
};

main();
