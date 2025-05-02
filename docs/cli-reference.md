# CLI Reference

## Overview

MCPCTL provides a comprehensive command-line interface for managing MCP servers and their configurations. This document details all available commands and their usage.

## Global Options

```bash
--help, -h       # Show help information
--version, -v    # Show version information
--debug          # Enable debug mode
--quiet          # Suppress output
--config <path>  # Specify config file path
```

## Commands

### Server Management

#### Search Servers

```bash
mcpctl search [options]

Options:
  --registry <name>     # Search in specific registry
  --name <name>         # Search by server name
  --query <text>        # Search by query text
  --limit <number>      # Limit number of results
  --use-llm-interactive # Use LLM for interactive search
  --semantic <text>     # Search using semantic meaning
```

#### Server List

```bash
mcpctl server list [options]

Options:
  --profile <name>      # Filter by profile
  --status <status>     # Filter by status
  --format <format>     # Output format (table, json)
```

#### Server Control

```bash
mcpctl server start <server-name> [options]
mcpctl server stop <server-name> [options]
mcpctl server restart <server-name> [options]
mcpctl server status <server-name> [options]

Options:
  --profile <name>      # Use specific profile
  --port <number>       # Specify port
  --mode <mode>         # Server mode (local, remote)
```

### Session Management

#### List Sessions

```bash
mcpctl session list [options]

Options:
  --profile <name>      # Filter by profile
  --status <status>     # Filter by status
  --format <format>     # Output format
```

#### Session Control

```bash
mcpctl session connect <server-name> [options]
mcpctl session disconnect <session-id> [options]
mcpctl session status <session-id> [options]

Options:
  --profile <name>      # Use specific profile
  --command <cmd>       # Specify command
  --client <name>       # Specify client
```

### Configuration Management

#### Profile Management

```bash
mcpctl profile create <name> [options]
mcpctl profile delete <name> [options]
mcpctl profile list [options]
mcpctl profile use <name> [options]

Options:
  --description <text>  # Profile description
  --copy-from <name>    # Copy from existing profile
```

#### Environment Variables

```bash
mcpctl config env set <key> <value> [options]
mcpctl config env get <key> [options]
mcpctl config env list [options]
mcpctl config env delete <key> [options]

Options:
  --profile <name>      # Use specific profile
  --server <name>       # Server-specific variable
```

#### Secrets Management

```bash
mcpctl config secret set <key> <value> [options]
mcpctl config secret get <key> [options]
mcpctl config secret list [options]
mcpctl config secret delete <key> [options]

Options:
  --profile <name>      # Use specific profile
  --server <name>       # Server-specific secret
  --encrypt             # Encrypt the secret
```

### Daemon Management

```bash
mcpctl daemon start [options]
mcpctl daemon stop [options]
mcpctl daemon restart [options]
mcpctl daemon status [options]

Options:
  --config <path>       # Specify daemon config
  --log-level <level>   # Set log level
```

### Log Management

#### View Logs

```bash
mcpctl logs [subcommand] [options]

Subcommands:
  daemon              # View daemon logs
  client              # View client logs
  server              # View server logs
  session             # View session logs

Options:
  --viewer <name>     # Log viewer (less, tail, bat, fzf)
  --type <type>       # Log type (for daemon logs)
  --server <name>     # Server name (for client logs)
  --date <date>       # Log date (for client logs)
  --window <window>   # Log window (for client logs)
  --all               # View all logs (for client logs)
  --instance <name>   # Server instance (for server logs)
  --profile <name>    # Server profile (for server logs)
  --since <time>      # Start time (for session logs)
  --until <time>      # End time (for session logs)
```

Each subcommand supports the following operations:

- `list`: List available logs
- `view`: View logs
- `follow`: Follow logs in real-time
- `remove`: Remove logs

### Examples

#### View Daemon Logs

```bash
# List available daemon logs
mcpctl logs daemon list

# View daemon logs using less
mcpctl logs daemon view --viewer less

# Follow daemon logs in real-time
mcpctl logs daemon follow

# View daemon error logs
mcpctl logs daemon view --type error

# Remove all daemon logs
mcpctl logs daemon remove

# Remove specific daemon log type
mcpctl logs daemon remove --type error
```

#### View Client Logs

```bash
# List available client logs
mcpctl logs client list

# View Claude logs
mcpctl logs client view claude

# View Cursor logs for a specific date and window
mcpctl logs client view cursor --date 2024-04-29 --window main

# View all Cursor logs
mcpctl logs client view cursor --all

# Follow Claude logs in real-time
mcpctl logs client follow claude

# Remove all Claude logs
mcpctl logs client remove claude

# Remove specific Claude server logs
mcpctl logs client remove claude --server my-server

# Remove specific Cursor logs
mcpctl logs client remove cursor --date 2024-04-29 --window main
```

#### View Server Logs

```bash
# List available server logs
mcpctl logs server list

# View server logs
mcpctl logs server view my-server

# View server logs for a specific instance
mcpctl logs server view my-server --instance instance-1

# Follow server logs in real-time
mcpctl logs server follow my-server --profile production

# Remove all server logs
mcpctl logs server remove

# Remove specific server logs
mcpctl logs server remove my-server --instance instance-1 --profile production
```

#### View Session Logs

```bash
# List available session logs
mcpctl logs session list

# View session logs
mcpctl logs session view session-123

# View session logs within a time range
mcpctl logs session view session-123 --since "2024-04-29 00:00:00" --until "2024-04-29 23:59:59"

# Follow session logs in real-time
mcpctl logs session follow session-123

# Remove all session logs
mcpctl logs session remove

# Remove specific session logs
mcpctl logs session remove session-123
```

### Client Integration

```bash
mcpctl install [options]

Options:
  --client <name>       # Target client
  --server-name <name>  # Server name
  --command <cmd>       # Command to run
  --profile <name>      # Use specific profile
```

## Examples

### Search for Servers

```bash
# Search by name
mcpctl search --registry glama --name my-mcp-server

# Search with LLM interaction
mcpctl search --query 'slack integration' --use-llm-interactive

# Semantic search
mcpctl search --semantic 'I need a server for Slack integration'
```

### Manage Server Instances

```bash
# Start a server
mcpctl server start my-mcp-server --profile production

# Check server status
mcpctl server status my-mcp-server

# Stop a server
mcpctl server stop my-mcp-server
```

### Manage Sessions

```bash
# Connect to a server
mcpctl session connect my-mcp-server --client claude

# List active sessions
mcpctl session list

# Disconnect a session
mcpctl session disconnect session-123
```

### Configuration Management

```bash
# Create a new profile
mcpctl profile create production --description "Production environment"

# Set environment variable
mcpctl config env set API_KEY "your-api-key" --profile production

# Set secret
mcpctl config secret set SLACK_TOKEN "xoxb-token" --encrypt
```

## Exit Codes

- `0`: Success
- `1`: General error
- `2`: Invalid usage
- `3`: Configuration error
- `4`: Permission denied
- `5`: Server error
- `6`: Network error
- `7`: Timeout
- `8`: Resource not found

```

```
