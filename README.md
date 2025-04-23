# MCPCTL - The MCP Execution Control Tool

`mcpctl` is a tool for controlling the MCP execution.

You can use `mcpctl` to:

- MCP Server Discovery
  - Search MCP servers on the repositories you specify.
  - Add and update repositories you like.
- MCP Server Instance Orchestration
  - Run the MCP server on your local machine.
  - Connect to the MCP server running, reusing the server instance.
- Config Management
  - Create and use profiles for the MCP server.
  - Profiles can store your server list, connection list, and configurations(auth data) for your MCP servers.

## Installation

### Prerequisites

- Node.js 18.17.1 or higher

### Install via npm

```bash
# Install globally with sudo/administrator privileges
sudo npm install -g @vessl-ai/mcpctl  # Linux/macOS
# Or on Windows (Run PowerShell as Administrator)
npm install -g @vessl-ai/mcpctl

# Or using other package managers
sudo pnpm install -g @vessl-ai/mcpctl
sudo yarn global add @vessl-ai/mcpctl
```

This will:

1. Install both `mcpctl` and `mcpctld` commands globally on your system
2. Create necessary log directories (`/var/log/mcpctl` on Unix, `C:\ProgramData\mcpctl\logs` on Windows)
3. Install and start the daemon service:
   - macOS: Creates and loads a LaunchDaemon
   - Linux: Creates and enables a systemd service
   - Windows: Creates and starts a Windows Service

If the installation doesn't have sufficient permissions to setup the daemon service, you can manually start it later:

```bash
# Linux/macOS
sudo mcpctl daemon start

# Windows (Run as Administrator)
mcpctl daemon start
```

You can restart the daemon by:

```bash
sudo mcpctl daemon stop
sudo mcpctl daemon start
```

### Updating

To update to the latest version:

```bash
# Linux/macOS
sudo npm update -g mcpctl

# Windows (Run as Administrator)
npm update -g mcpctl
```

### Troubleshooting

If you encounter any issues with the daemon:

1. Check the daemon status:

```bash
mcpctl daemon status
```

2. Check the logs:

- Linux/macOS: `/var/log/mcpctl/daemon.log`
- Windows: `C:\ProgramData\mcpctl\logs\daemon.log`

3. Try restarting the daemon:

```bash
# Linux/macOS
sudo mcpctl daemon stop
sudo mcpctl daemon start

# Windows (Run as Administrator)
mcpctl daemon stop
mcpctl daemon start
```

## Quickstart

### Search MCP Servers

Popular repositories included:

- glama
- smithery
- pulsemcp
- (more coming soon... you can also add your own repositories-> see [Add MCP Server Registry](#add-mcp-server-registry))
- (or contribution is always welcome!)

#### Search by registry and server name

You can search for MCP servers by registry and server name.

```bash
mcpctl search --registry glama --name my-mcp-server
```

#### Search by query

You can search for MCP servers by query.

```bash
mcpctl search --query 'slack' [--registry glama] [--limit 10] [--use-llm-interactive (or -i)]
```

#### FUNNY: Interactive LLM with your search result

You can use LLM to interact with your search result.

```bash
export OPENAI_API_KEY=<your-openai-api-key>
export OPENAI_MODEL=gpt-4o-mini # default is gpt-4o-mini
mcpctl search --query 'slack' --use-llm-interactive
```

(Currently, it only supports OpenAI API.)

####

```bash
export OPENAI_API_KEY=<your-openai-api-key>
mcpctl search --semantic 'I want to search for a MCP server that can do X'
```

### Install to your client

Adding to clients like Claude, Cursor, etc.

- Currently it only supports claude desktop and cursor.

```bash
mcpctl install --client claude --server-name my-mcp-server --command 'npx -y @wonderwhy-er/desktop-commander'
```

This will generate a mcpServer entry that contains connect command.

```json
{
  "mcpServer": {
    "my-mcp-server": {
      "type": "stdio",
      "command": "mcpctl",
      "args": [
        "session",
        "connect",
        "--server",
        "my-mcp-server",
        "--command",
        "npx -y @wonderwhy-er/desktop-commander"
      ],
      "env": {
        "MCPCTL_LOG_FILE": "${HOME}/.mcpctl/logs/my-mcp-server-stdio--npx--y--wonderwhy-er-desktop-commander.log",
        "MCPCTL_LOG_LEVEL": "INFO"
      }
    }
  }
}
```

You can add the same entry to multiple clients.

```bash
mcpctl install --server-name my-mcp-server --command 'npx -y @wonderwhy-er/desktop-commander' --client claude --client cursor
```

And they will use the same mcp server instance.

### MCP Servers and Connection Sessions

To list all MCP servers you have:

```bash
mcpctl server list
```

This will list all MCP servers you have, including the status of the server.

```bash
┌──────────────────────────────────────────────────────┬─────────────┬─────────┬─────────┬───────┬───────────┬───────────────────────┬──────┬────────────────────────┐
│ ID                                                   │ SERVER_NAME │ PROFILE │ STATUS  │ MODE  │ TRANSPORT │ SSE_ENDPOINT          │ PORT │ CREATED AT             │
├──────────────────────────────────────────────────────┼─────────────┼─────────┼─────────┼───────┼───────────┼───────────────────────┼──────┼────────────────────────┤
│ server-instance.251c2735-f8c0-467f-a16b-8769d6187767 │ real-slack  │ default │ running │ local │ sse       │ http://localhost:8000 │ 8000 │ YYYY. MM. DD. HH:MM:SS │
└──────────────────────────────────────────────────────┴─────────────┴─────────┴─────────┴───────┴───────────┴───────────────────────┴──────┴────────────────────────┘
```

To list all connection sessions you have:

```bash
mcpctl session list
```

This will list all connections you have, including the status of the connection.

```bash
ID     MCP_SERVER(ID)    CLIENTS    PROFILE    STATUS    CREATED AT
1      glama/my-mcp-server(1)    "claude, cursor"    default    running    2024-01-01 12:00:00
2      glama/my-mcp-server-2(2)    "claude"    default    running    2024-01-01 12:00:00
```

### Config Management

You can manage your env vars and secrets for your MCP server.

```bash
mcpctl config set --server-name my-mcp-server --env SLACK_BOT_TOKEN=xoxb-your-slack-bot-token
```

### Profile Management

You can add add your MCP server configurations to a profile.

```bash
mcpctl profile create my-profile
```

You can get/set your env vars and secrets to the profile.

example:

```bash
mcpctl profile get-env my-profile -s real-slack
{
  SLACK_BOT_TOKEN: 'xoxb-your-slack-bot-token',
  SLACK_TEAM_ID: 'your-slack-team-id'
}
```

This config will be automatically used when you connect to the MCP server if you specify the profile.

```bash
## Originally
mcpctl session connect --server-name real-slack --command 'npx -y @modelcontextprotocol/server-slack' --env SLACK_BOT_TOKEN=xoxb-your-slack-bot-token --env SLACK_TEAM_ID=your-slack-team-id

## with using profile
mcpctl session connect --profile my-profile --server-name real-slack --command 'npx -y @modelcontextprotocol/server-slack'
```

Under the hood, `mcpctl` will use the profile to set the config for the MCP server.

```
`mcpctl session connect --profile my-profile`
      |
      v
cli finds the matching profile and server name, mixup the env vars
      |
      v
orchestrator uses the envvars to start the MCP server (if same, uses existing)
      |
      v
mcpctl creates a new session and connect to the MCP server
```

So, if config in a profile for a repo/name is changed, orchestrator will automatically rollout the mcp server with the new config.

You can easily change the profile while you connect to the MCP server, by each client.

```bash
mcpctl install --server-name my-mcp-server --client claude --profile my-profile-1 --command 'npx -y @wonderwhy-er/desktop-commander'
mcpctl install --server-name my-mcp-server --client cursor --profile my-profile-2 --command 'npx -y @wonderwhy-er/desktop-commander'
```

Using this, your claude will use `my-profile-1` and cursor will use `my-profile-2`.

If they use the same mcp tool - e.g. slack, the different profiles can hold different slack account's SLACK_BOT_TOKEN.

### Managing registries

You can add your own registries to `mcpctl`.

```bash
mcpctl registry add --name my-registry --url https://github.com/my-registry
```

## Product Roadmap

- [ ] Index registry to speed up the search.

(TODO) You can pre-index your registry to speed up the semantic search.

```bash
mcpctl registry index --name my-registry
```

- (TBU) This will fire up a new vectordb instance and index your registry.

- [ ] Save and load MCP Server Set by profile.

- [ ] Semantic search on registries.
