# MCPCTL CLI

A powerful CLI for managing MCP servers, secrets, profiles, and the control plane.
If you want to automate or script your MCP workflows, this is the tool you need.

## Installation

```bash
npm install -g @vessl-ai/mcpctl
```

## Usage

```bash
mcpctl <command> [subcommand] [options]
```

## Commands

### Server Management (`server`)

- Start a server:

  ```bash
  mcpctl server start --file <spec.json> [--profile <name>]
  ```

  - `--file`: Path to the server spec JSON file (required)
  - `--profile`: Profile name for environment variable injection

- Stop a server:

  ```bash
  mcpctl server stop <server-name>
  ```

- Restart a server:

  ```bash
  mcpctl server restart <server-name>
  ```

- Get server status:

  ```bash
  mcpctl server status <server-name>
  ```

- List servers:
  ```bash
  mcpctl server list
  ```

### Secret Management (`secret`)

- Add a secret:

  ```bash
  mcpctl secret add <name> --value <value> [--source <vault|keychain|env>]
  ```

- Get a secret:

  ```bash
  mcpctl secret get <name> [--source <vault|keychain|env>]
  ```

- List secrets:

  ```bash
  mcpctl secret list [--source <vault|keychain|env>]
  ```

- Remove a secret:
  ```bash
  mcpctl secret remove <name> [--source <vault|keychain|env>]
  ```

### Profile Management (`profile`)

- Create a profile:

  ```bash
  mcpctl profile create <name> [--description <text>] [--copy-from <name>]
  ```

- Delete a profile:

  ```bash
  mcpctl profile delete <name>
  ```

- List profiles:

  ```bash
  mcpctl profile list
  ```

- Use a profile:

  ```bash
  mcpctl profile use <name>
  ```

- Set profile environment variable:

  ```bash
  mcpctl profile env set <key> <value> [--profile <name>]
  ```

- Get profile environment variable:

  ```bash
  mcpctl profile env get <key> [--profile <name>]
  ```

- List profile environment variables:

  ```bash
  mcpctl profile env list [--profile <name>]
  ```

- Delete profile environment variable:
  ```bash
  mcpctl profile env delete <key> [--profile <name>]
  ```

### Control Plane Management (`control-plane` or `cp`)

- Start the control plane:

  ```bash
  mcpctl control-plane start [--foreground]
  ```

- Stop the control plane:

  ```bash
  mcpctl control-plane stop
  ```

- Restart the control plane:

  ```bash
  mcpctl control-plane restart
  ```

- Get control plane status:

  ```bash
  mcpctl control-plane status
  ```

- View control plane logs:
  ```bash
  mcpctl control-plane logs [--type <stdout|stderr>]
  ```

## Configuration

- All configuration, profiles, and secrets are stored in `~/.mcpctl` by default.
- Set the environment variable `DEBUG=true` for verbose logging.

## Contributing

Contributions are welcome!
If you have suggestions, bug reports, or want to add features, please open an issue or submit a pull request.

---

Ready to automate your MCP workflows?
Clone, install, and get started!
