# MCPCTL CLI Reference

## Global Options

```bash
--help, -h       # Show help information
--version, -v    # Show version information
--debug          # Enable debug mode
--quiet          # Suppress output
```

## Commands

### Server Management

#### Start Server

```bash
mcpctl server start -f <spec.json> [--profile <name>]
```

#### Stop Server

```bash
mcpctl server stop <server-name>
```

#### Restart Server

```bash
mcpctl server restart <server-name>
```

#### Server Status

```bash
mcpctl server status <server-name>
```

#### List Servers

```bash
mcpctl server list
```

#### Remove Server

```bash
mcpctl server remove <server-name>
```

### Secret Management

#### Add Secret

```bash
mcpctl secret add <name> --value <value> [--source <vault|keychain|env>]
```

#### List Secrets

```bash
mcpctl secret list [--source <vault|keychain|env>]
```

#### Get Secret

```bash
mcpctl secret get <name> [--source <vault|keychain|env>]
```

#### Remove Secret

```bash
mcpctl secret remove <name> [--source <vault|keychain|env>]
```

### Profile Management

#### Create Profile

```bash
mcpctl profile create <name> [--description <text>] [--copy-from <name>]
```

#### Delete Profile

```bash
mcpctl profile delete <name>
```

#### List Profiles

```bash
mcpctl profile list
```

#### Use Profile

```bash
mcpctl profile use <name>
```

#### Read Profile

```bash
mcpctl profile read <name>
```

#### Profile Env Management

- Set:

```bash
mcpctl profile env set <key> <value> [--profile <name>]
```

- Get:

```bash
mcpctl profile env get <key> [--profile <name>]
```

- List:

```bash
mcpctl profile env list [--profile <name>]
```

- Delete:

```bash
mcpctl profile env delete <key> [--profile <name>]
```

### Control Plane Management

#### Start Control Plane

```bash
mcpctl control-plane start
```

#### Stop Control Plane

```bash
mcpctl control-plane stop
```

#### Restart Control Plane

```bash
mcpctl control-plane restart
```

#### Control Plane Status

```bash
mcpctl control-plane status
```

#### Control Plane Logs

```bash
mcpctl control-plane logs
```

### Log Management

#### Server Logs

```bash
mcpctl log server <server-name> [--limit <number>]
```

#### Control Plane Logs

```bash
mcpctl log control-plane [--limit <number>]
```

---

## Example: serverRunSpec JSON

Below is a sample `serverRunSpec` file for running a Slack server. This file defines all required and optional fields. You can use this as a template for your own server specifications.

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

> **Tip:**
> For more examples, see the `examples/runspec/` directory in this repository.

```

```
