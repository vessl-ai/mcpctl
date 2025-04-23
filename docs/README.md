# MCPCTL Documentation

## Overview

MCPCTL (MCP Execution Control Tool) is a powerful command-line tool for managing and controlling MCP (Model Control Protocol) servers. This tool provides comprehensive functionality for server discovery, instance orchestration, and configuration management.

## Table of Contents

1. [Installation](./installation.md)
2. [Core Concepts](./core-concepts.md)
3. [Features](./features.md)
   - [Server Discovery](./features/server-discovery.md)
   - [Server Instance Management](./features/server-instance.md)
   - [Configuration Management](./features/configuration.md)
   - [Profile Management](./features/profile.md)
4. [CLI Reference](./cli-reference.md)
5. [Architecture](./architecture.md)
6. [Development Guide](./development.md)

## Quick Links

- [Installation Guide](./installation.md)
- [CLI Commands](./cli-reference.md)
- [Configuration Guide](./features/configuration.md)

## Project Structure

```
mcpctl/
├── src/
│   ├── cli/        # Command-line interface implementation
│   ├── core/       # Core business logic
│   ├── daemon/     # Daemon service implementation
│   └── lib/        # Shared libraries and utilities
├── docs/           # Documentation
├── scripts/        # Build and utility scripts
└── tests/          # Test files
```

## Contributing

Please refer to the [Development Guide](./development.md) for information on how to contribute to this project.
