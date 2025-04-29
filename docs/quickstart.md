# Quick Start Guide

This guide will help you get started with `mcpctl` - the MCP Execution Control Tool.

## Prerequisites

- Node.js 18.17.1 or higher
- Operating System: Linux, macOS, or Windows
- Administrative privileges (for global installation)

## Installation

### Global Installation

This will automatically require sudo privileges for starting the daemon.

```bash
# Using npm
npm install -g @vessl-ai/mcpctl

# Using pnpm
pnpm install -g @vessl-ai/mcpctl

# Using yarn
yarn global add @vessl-ai/mcpctl
```

### Verify Installation

```bash
mcpctl --version
```

## First Steps

### 1. Start the Daemon

The mcpctl daemon is required for most operations:

```bash
# Start the daemon
mcpctl daemon start

# Check daemon status
mcpctl daemon status
```

### 2. Search for MCP Servers

```bash
# Basic search
mcpctl search --registry glama

# Search with specific name
mcpctl search --registry glama --name my-mcp-server

# Search with query
mcpctl search --query 'slack' --registry glama --limit 10

# Search with LLM interactivity
mcpctl search --query 'slack' --registry glama --use-llm-interactive (or -i)
```

### 3. Create a Profile

Profiles help manage different configurations:

```bash
# Create a new profile
mcpctl profile create my-profile

# Set environment variables
mcpctl config env set --profile my-profile --entry SLACK_TEAM_ID=1234567890

# Set secret
mcpctl config secret set --profile my-profile --entry SLACK_BOT_TOKEN=your-token
```

### 4. Install and Run a Server

```bash
# Install a server to a client
mcpctl install --client claude --server-name my-mcp-server \
  --command 'npx -y @wonderwhy-er/desktop-commander'

# Connect to a server using a profile
mcpctl session connect --profile my-profile --server-name my-server
```

## Common Operations

### Managing Servers

```bash
# List all servers
mcpctl server list

# Get server details
mcpctl server info --name my-server
```

### Managing Sessions

```bash
# List active sessions
mcpctl session list

# Start a new session
mcpctl session start --server-name my-server

# Stop a session
mcpctl session stop --session-id <session-id>
```

### Registry Management

```bash
# Add a custom registry
mcpctl registry add --name my-registry --url https://github.com/my-registry

# List registries
mcpctl registry list
```

## Troubleshooting

### Daemon Issues

```bash
# Check daemon status
mcpctl daemon status

# Restart daemon
mcpctl daemon restart

# View daemon logs (see stderr logs for more details)
# Linux/macOS: /var/log/mcpctl/daemon.log, /var/log/mcpctl/daemon.error.log
# Windows: C:\ProgramData\mcpctl\logs\daemon.log, C:\ProgramData\mcpctl\logs\daemon.error.log
```

### Common Issues

Please file any issues on [GitHub](https://github.com/vessl-ai/mcpctl/issues).

#### 1. **Daemon not starting**

- Check if you have sufficient permissions
- Verify port availability
- Check system logs

#### 2. **Server connection failures**

- Verify server is running
- Check network connectivity
- Validate profile configuration
- View logs for more details

#### 3. **Search not working**

- Check registry connectivity
- Verify search parameters

## Next Steps

- Read the [Core Concepts](core-concepts.md) guide
- Explore the [CLI Reference](cli-reference.md)
- Check out the [Architecture](architecture.md) documentation
- Learn about [Development](development.md)
