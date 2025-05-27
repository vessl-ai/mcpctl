# Installation Guide

## Prerequisites

- Node.js 18.17.1 or higher
- Package manager (npm or pnpm recommended)

## Install MCPCTL (CLI)

### Using npm

```bash
npm install -g @vessl-ai/mcpctl
```

### Using pnpm

```bash
pnpm install -g @vessl-ai/mcpctl
```

## Verify Installation

```bash
mcpctl --version
```

## Control Plane (Daemon) Management

After installation, you can manage the control plane (background service) with the following commands:

- Start:
  ```bash
  mcpctl control-plane start
  ```
- Stop:
  ```bash
  mcpctl control-plane stop
  ```
- Status:
  ```bash
  mcpctl control-plane status
  ```
- Restart:
  ```bash
  mcpctl control-plane restart
  ```

> On macOS/Linux, you may need to use `sudo` for global install or to start the control plane as a system service.

## Updating MCPCTL

```bash
npm update -g @vessl-ai/mcpctl
# or
pnpm update -g @vessl-ai/mcpctl
```

## Uninstall MCPCTL

```bash
npm uninstall -g @vessl-ai/mcpctl
# or
pnpm uninstall -g @vessl-ai/mcpctl
```

## Troubleshooting

- Make sure your Node.js version is 18.17.1 or higher
- If you see permission errors, try with `sudo` (macOS/Linux)
- For more help, check [GitHub Issues](https://github.com/vessl-ai/mcpctl/issues)
