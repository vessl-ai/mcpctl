# MCPCTL Documentation

## Overview

MCPCTL (Model Control Protocol Control Tool) is a modern CLI for managing, running, and orchestrating MCP servers. It provides robust features for server lifecycle management, configuration, secrets, profiles, and logs—all from the command line.

## Table of Contents

1. [Quick Start](./quickstart.md)
2. [Installation](./installation.md)
3. [Core Concepts](./core-concepts.md)
4. [Features](./features/index.md)
   - [Server Instance Management](./features/server-instance.md)
   - [Configuration Management](./features/configuration.md)
   - [Profile Management](./features/profile.md)
5. [CLI Reference](./cli-reference.md)
6. [Architecture](./architecture.md)
7. [Development Guide](./development.md)

## Quick Links

- [Quick Start](./quickstart.md)
- [Installation](./installation.md)
- [CLI Reference](./cli-reference.md)
- [Configuration](./features/configuration.md)

## Project Structure

```text
mcpctl/
├── apps/
│   ├── cli/           # CLI implementation
│   └── control-plane/ # Control plane service
├── packages/
│   └── shared/        # Shared libraries and types
├── docs/              # Documentation
├── examples/          # Example specs and configs
└── tests/             # Test files
```

## Contributing

See the [Development Guide](./development.md) for how to contribute, report issues, or request features.
