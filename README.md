# MCPCTL - The MCP Execution Control Tool

`mcpctl` is a tool for controlling the MCP execution.

You can use `mcpctl` to:

- MCP Server Discovery
  - Search MCP servers on the repositories you specify.
  - Add and update repositories you like.
- MCP Server Instance Orchestration
  - Run the MCP server on your local machine.
  - Connect to the MCP server running, reusing the server instance.
- Profile Management
  - Create and use profiles for the MCP server.
  - Profiles can store your server list, connection list, and configurations(auth data) for your MCP servers.

## Installation

### Prerequisites

- Node.js 18.17.1 or higher

### Install via npm

```bash
# Install globally with sudo/administrator privileges
sudo npm install -g mcpctl  # Linux/macOS
# Or on Windows (Run PowerShell as Administrator)
npm install -g mcpctl

# Or using other package managers
sudo pnpm install -g mcpctl
sudo yarn global add mcpctl
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
- (more coming soon... you can also add your own repositories-> see [Add MCP Server Repository](#add-mcp-server-repository))
- (or contribution is always welcome!)

#### Search by repository and server name

You can search for MCP servers by repository and server name.

```bash
mcpctl search --repo glama --name my-mcp-server
```

#### Semantic Search (TODO)

Or you can do a semantic search, using OPENAI_API_KEY.

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
ID     REPO/NAME    PROFILE     STATUS    MODE    TRANSPORT    SSE_ENDPOINT    CREATED AT
1      glama/my-mcp-server    default    running    process    stdio    http://localhost:8080/sse   2024-01-01 12:00:00
2      glama/my-mcp-server-2    default    running    container    SSE    http://localhost:8081/sse   2024-01-01 12:00:00
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

### Profile Management

You can add add your MCP server configurations to a profile.

```bash
mcpctl profile add --name my-profile
mcpctl profile set-config --repo glama --name my-mcp-server --key auth.token --value my-token
```

This config will be automatically used when you connect to the MCP server.

```bash
mcpctl connect --repo glama --name my-mcp-server --profile my-profile
```

Under the hood, `mcpctl` will use the profile to set the config for the MCP server.

```
`mcpctl connect --profile my-profile`
      |
      v
orchestrator finds the matching profile,
      |
      v
orchestrator finds repo/name in the profile,
      |
      v
orchestrator uses the profile to start the MCP server
      |
      v
mcpctl connect to the MCP server
```

So, if config in a profile for a repo/name is changed, orchestrator will automatically rollout the mcp server with the new config. (TODO)

You can easily change the profile while you connect to the MCP server, by each client.

```bash
mcpctl install --repo glama --name my-mcp-server --client claude --profile my-profile-1
mcpctl install --repo glama --name my-mcp-server --client cursor --profile my-profile-2
```

Using this, your claude will use `my-profile-1` and cursor will use `my-profile-2`.

If they use the same mcp tool - e.g. slack, the different profiles can hold different slack account's SLACK_BOT_TOKEN.

### Managing registries

You can add your own registries to `mcpctl`.

```bash
mcpctl registry add --name my-registry --url https://github.com/my-registry
```

(TODO) You can pre-index your registry to speed up the semantic search.

```bash
mcpctl registry index --name my-registry
```

- (TBU) This will fire up a new vectordb instance and index your registry.
