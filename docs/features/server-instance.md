# Server Instance Management

## Overview

MCPCTL lets you manage the lifecycle of MCP server instances: start, stop, restart, check status, list, and remove servers. You can also view logs and apply profiles for environment-specific configuration.

## Commands

### Start a server

```bash
mcpctl server start -f <spec.json> [--profile <name>]
```

#### Spec file format (serverRunSpec)

The spec file is a JSON file describing how to run your server. Below is an example and field descriptions:

```json
{
  "name": "server-slack",
  "resourceType": "remote",
  "transport": {
    "type": "stdio"
  },
  "command": "npx -y @modelcontextprotocol/server-slack",
  "env": {
    "SLACK_TEAM_ID": "T00000000"
  },
  "secrets": {
    "SLACK_BOT_TOKEN": {
      "source": "keychain",
      "key": "slack-bot-token"
    }
  }
}
```

**Field Descriptions:**

- `name` (string, required): Unique name for the server instance.
- `resourceType` (string, required): Resource type, e.g. `local` or `remote`.
- `transport` (object or string, required): Transport type for server communication. Example: `{ "type": "stdio" }` or a string like `"sse"`.
- `command` (string or array, required): Command to launch the server. Can be a string or an array of command/args.
- `env` (object, optional): Environment variables to inject into the server process.
- `secrets` (object, optional): Secrets to inject. Each key can specify a value or a reference (with `source` and `key`).

> For more examples, see the `examples/runspec/` directory in this repository.

### Stop a server

```bash
mcpctl server stop <server-name>
```

### Restart a server

```bash
mcpctl server restart <server-name>
```

### Get server status

```bash
mcpctl server status <server-name>
```

### List all servers

```bash
mcpctl server list
```

### Remove a server

```bash
mcpctl server remove <server-name>
```

### View server logs

```bash
mcpctl log server <server-name> [--limit <number>]
```

## Using Profiles

You can apply a profile to inject environment variables and secrets when starting a server:

```bash
mcpctl server start -f <spec.json> --profile <profile-name>
```

See [Configuration Management](./configuration.md) for details on managing profiles, environment variables, and secrets.

## Example

```bash
# Start a server with a profile
mcpctl server start -f server-slack.json --profile dev

# Check server status
mcpctl server status server-slack

# View logs
mcpctl log server server-slack --limit 100

# Stop and remove
mcpctl server stop server-slack
mcpctl server remove server-slack
```
