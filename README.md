# MCPCTL - The MCP Execution Control Tool

`mcpctl` is a command-line tool for controlling MCP (Model Context Protocol) server execution and management.

## 📚 Documentation

- [Core Concepts](docs/core-concepts.md)
- [CLI Reference](docs/cli-reference.md)
- [Architecture](docs/architecture.md)
- [Development Guide](docs/development.md)
- [Installation Guide](docs/installation.md)
- [Contributing Guide](docs/contributing.md)

## ✨ Features

### 🔍 MCP Server Discovery

- Search MCP servers across multiple repositories
- Add and manage custom repositories
- Interactive LLM-powered search (OpenAI integration)
- Registry-based server indexing

### 🚀 Server Management

- Run MCP servers locally
- Connect to existing server instances
- Manage server sessions
- Monitor server status and health

### 📝 Log Management

- View daemon, client, server, and session logs
- Real-time log following
- Multiple log viewer support (less, tail, bat, fzf)
- Filtered log viewing by date, window, and instance

### ⚙️ Configuration Management

- Profile-based configuration management
- Environment variable and secret management
- Custom registry configuration
- Client-specific settings

## 🚀 Quick Start

### Installation

```bash
# Install globally (requires sudo/admin privileges)
sudo npm install -g @vessl-ai/mcpctl

# Alternative package managers
sudo pnpm install -g @vessl-ai/mcpctl
sudo yarn global add @vessl-ai/mcpctl
```

### Basic Usage

1. **Search for MCP Servers**

```bash
# Search by registry and name
mcpctl search --registry glama --name my-mcp-server

# Search with query
mcpctl search --query 'slack' --registry glama --limit 10

# Interactive LLM search
export OPENAI_API_KEY=<your-key>
mcpctl search --query 'slack' --use-llm-interactive
```

2. **Install to Clients**

```bash
mcpctl install --client claude --server-name my-mcp-server \
  --command 'npx -y @wonderwhy-er/desktop-commander'
```

3. **Manage Servers and Sessions**

```bash
# List servers
mcpctl server list

# List sessions
mcpctl session list
```

4. **View Logs**

```bash
# View daemon logs
mcpctl logs daemon view

# View client logs
mcpctl logs client view claude|cursor|...

# View server logs
mcpctl logs server view my-server

# View session logs
mcpctl logs session view session-123
```

## 🔧 Configuration

### Profile Management

```bash
# Create a profile
mcpctl profile create my-profile

# Set environment variables
mcpctl profile set-env my-profile -s real-slack SLACK_BOT_TOKEN=your-token

# Use profile for connection
mcpctl session connect --profile my-profile --server-name real-slack
```

### Registry Management

```bash
# Add custom registry
mcpctl registry add --name my-registry --url https://github.com/my-registry
```

## 🛠️ System Requirements

- Node.js 18.17.1 or higher
- Operating System: Linux, macOS, or Windows

## 🔍 Troubleshooting

1. Check daemon status:

```bash
mcpctl daemon status
```

2. View logs:

- Linux/macOS: `/var/log/mcpctl/daemon.log`
- Windows: `C:\ProgramData\mcpctl\logs\daemon.log`

3. Restart daemon:

```bash
# Linux/macOS
sudo mcpctl daemon stop
sudo mcpctl daemon start

# Windows (Run as Administrator)
mcpctl daemon stop
mcpctl daemon start
```

## 🗺️ Roadmap

- [ ] Registry indexing for faster search
- [ ] Profile-based MCP Server Set management
- [ ] Enhanced semantic search capabilities
- [ ] Container / Kubernetes based MCP Server instance management

## 📝 License

MIT License - See [LICENSE](LICENSE) for details
