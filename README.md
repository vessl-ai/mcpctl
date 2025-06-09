# MCPCTL - The MCP Execution Control Tool

[![npm version](https://img.shields.io/npm/v/@vessl-ai/mcpctl.svg?style=flat-square)](https://www.npmjs.com/package/@vessl-ai/mcpctl)
[![npm downloads](https://img.shields.io/npm/dm/@vessl-ai/mcpctl.svg?style=flat-square)](https://www.npmjs.com/package/@vessl-ai/mcpctl)
[![GitHub release](https://img.shields.io/github/v/release/vessl-ai/mcpctl?style=flat-square)](https://github.com/vessl-ai/mcpctl/releases)

MCPCTL is the CLI for managing Model Context Protocol (MCP) servers, secrets, profiles, and the control plane. Fast, reliable, and built for automation.

## Install

```bash
npm install -g @vessl-ai/mcpctl
# or
yarn global add @vessl-ai/mcpctl
# or
pnpm install -g @vessl-ai/mcpctl
```

## Documentation

- [Core Concepts](docs/core-concepts.md)
- [CLI Reference](docs/cli-reference.md)
- [Architecture](docs/architecture.md)
- [Development Guide](docs/development.md)
- [Installation Guide](docs/installation.md)
- [Contributing Guide](docs/contributing.md)

## Usage

```bash
mcpctl <command> [subcommand] [options]
```

## Commands

### Server Management

```bash
mcpctl server start -f <spec.json> [--profile <name>]
mcpctl server stop <server-name>
mcpctl server restart <server-name>
mcpctl server status <server-name>
mcpctl server list
mcpctl server remove <server-name>
```

### Secret Management

```bash
mcpctl secret add <name> --value <value> [--source <vault|keychain|env>]
mcpctl secret get <name> [--source <vault|keychain|env>]
mcpctl secret list [--source <vault|keychain|env>]
mcpctl secret remove <name> [--source <vault|keychain|env>]
```

### Profile Management

```bash
mcpctl profile create <name> [--description <text>] [--copy-from <name>]
mcpctl profile delete <name>
mcpctl profile list
mcpctl profile use <name>
mcpctl profile read <name>
mcpctl profile env set <key> <value> [--profile <name>]
mcpctl profile env get <key> [--profile <name>]
mcpctl profile env list [--profile <name>]
mcpctl profile env delete <key> [--profile <name>]
```

### Toolset Management

```bash
mcpctl toolset save <name> --client <client> [--description <desc>]
# Save the current client config's toolset (servers) as a named toolset file. Optionally add a description.

mcpctl toolset load <name> --client <client>
# Load a saved toolset into the current client config. Prompts to save the current config before loading.

mcpctl toolset list [--client <client>]
# List all saved toolsets for the given client (or all clients).
```

### Control Plane Management

```bash
mcpctl control-plane start
mcpctl control-plane stop
mcpctl control-plane restart
mcpctl control-plane status
mcpctl control-plane logs
```

### Log Management

```bash
mcpctl log server <server-name> [--limit <number>]
mcpctl log control-plane [--limit <number>]
```

## Configuration

All configuration, profiles, and secrets are stored in `~/.mcpctl` by default.
Set `DEBUG=true` for verbose logging.

## License

MIT License. See [LICENSE](LICENSE) for details.
