# Core Concepts

## What is MCPCTL?

MCPCTL is a CLI tool for managing MCP (Model Control Protocol) servers. It helps you start, stop, and monitor server instances, manage configuration, profiles, and secrets—all from the command line.

## Key Concepts

### MCP Server

A process that implements the Model Control Protocol. It exposes endpoints for model execution and control.

### Server Instance

A running instance of an MCP server, managed by MCPCTL. Each instance has a unique name and state.

### Profile

A named set of configuration (environment variables, secrets) that can be applied to server instances. Profiles let you easily switch between environments (dev, staging, prod, etc).

### Secret

A sensitive value (API key, token, credential) managed securely (default: OS keychain). Secrets are injected into server instances at runtime.

### Environment Variable

A key-value pair injected into a server process. Managed per profile.

## Data Flow

1. User runs a CLI command (e.g. start server)
2. MCPCTL loads the relevant profile, env, and secrets
3. MCPCTL starts or manages the server instance
4. Status and logs are reported back to the user

## Security

- Secrets are stored in the OS keychain by default
- Profiles isolate configuration for different environments
- No remote secret storage by default (vault: WIP)

## Best Practices

- Use profiles for each environment
- Store secrets in the keychain, not in plain config files
- Monitor server status and logs regularly
- Keep MCPCTL and your servers up to date

> For more details, see [Configuration Management](./features/configuration.md) and [Server Instance Management](./features/server-instance.md).
