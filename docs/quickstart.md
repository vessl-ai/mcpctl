# Quick Start Guide

This guide will help you get started with `mcpctl` for managing MCP servers.

## Prerequisites

- Node.js 18.17.1 or higher
- Linux, macOS, or Windows

## 1. Install MCPCTL

```bash
npm install -g @vessl-ai/mcpctl
# or
pnpm install -g @vessl-ai/mcpctl
```

## 2. Verify Installation

```bash
mcpctl --version
```

## 3. Start the Control Plane

```bash
mcpctl control-plane start
```

## 4. Create a Profile

```bash
mcpctl profile create dev --description "Development environment"
mcpctl profile use dev
```

## 5. Set Environment Variables and Secrets

```bash
mcpctl profile env set SLACK_TEAM_ID T00000000
mcpctl secret add SLACK_BOT_TOKEN --value xoxb-xxx
```

## 6. Prepare a Server Spec

Create a file `server-slack.json`:

```json
{
  "name": "server-slack",
  "resourceType": "remote",
  "transport": { "type": "stdio" },
  "command": "npx -y @modelcontextprotocol/server-slack",
  "env": { "SLACK_TEAM_ID": "T00000000" },
  "secrets": {
    "SLACK_BOT_TOKEN": { "source": "keychain", "key": "SLACK_BOT_TOKEN" }
  }
}
```

## 7. Start a Server

```bash
mcpctl server start -f server-slack.json --profile dev
```

This will return server information containing server url.

```bash
🚀 Server started!
  name: server-slack
  id = server_instance_<uuid>
  runSpec = {
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
      "key": "SLACK_BOT_TOKEN"
    }
  },
  "id": "server_runspec_<uuid>"
}
  status = running
  createdAt = 2025-01-01T00:00:00.000Z
  updatedAt = 2025-01-01T00:00:00.000Z
  host = localhost
  port = 8009
  transport = {
  "type": "sse"
}
  processId = 1809
  connectionUrl = http://localhost:8009/sse
```

## 8. Connect to the Server

```bash
mcpctl client connect server-slack --client claude|cursor
```

This will add the SSE URL to the MCP JSON file of the client.

## 9. Check Server Status

```bash
mcpctl server status server-slack
```

## 10. View Server Logs

```bash
mcpctl log server server-slack --limit 100
```

## 11. Stop and Remove the Server

```bash
mcpctl server stop server-slack
mcpctl server remove server-slack
```

## Next Steps

- See [CLI Reference](cli-reference.md) for all commands
- See [Configuration Management](features/configuration.md) for profile/env/secret details
- See [Server Instance Management](features/server-instance.md) for more examples
