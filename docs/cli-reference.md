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
