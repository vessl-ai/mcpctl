# Architecture

## System Overview

MCPCTL is designed as a modular CLI tool for managing MCP servers, with a clear separation between the CLI, core logic, and control plane (daemon). Shared libraries provide common types and utilities.

## Component Diagram

```
User
 │
 ▼
CLI (apps/cli)
 │
 ▼
Control Plane (apps/control-plane)
 │
 ▼
MCP Server(s)
```

- **CLI**: Handles user commands, argument parsing, and output formatting.
- **Control Plane**: Runs as a background service, manages server lifecycle, and provides orchestration.
- **Shared**: Common types, utilities, and interfaces (packages/shared).

## Data Flow

1. **User Command** → CLI parses input → Core logic processes → Control Plane executes server actions → Result/output to user
2. **Profile/Secret/Env**: Managed in local config files and keychain, injected at server start

## Security

- Secrets stored in OS keychain (default)
- Profile-based isolation of configuration
- No remote secret storage by default (vault: WIP)

## Error Handling

- User-facing errors surfaced in CLI output
- Internal errors logged by control plane

## Extensibility

- Modular command structure (add new commands easily)
- Shared types/utilities for plugin or API extension (planned)

## Deployment

- **Local**: CLI and control plane run on user machine
- **Remote**: CLI can control remote MCP servers via control plane

> For more details, see the source code in `apps/cli/`, `apps/control-plane/`, and `packages/shared/`.
