# Configuration Management

## Overview

MCPCTL provides simple and secure management of profiles, environment variables, and secrets for your servers. All configuration is profile-based, so you can easily switch between different environments.

## Profile Management

Profiles let you manage separate sets of configuration for different environments (e.g. dev, staging, prod). You can create, delete, list, use, and inspect profiles.

### Create a profile

```bash
mcpctl profile create <name> [--description <text>] [--copy-from <name>]
```

### Delete a profile

```bash
mcpctl profile delete <name>
```

### List all profiles

```bash
mcpctl profile list
```

### Use a profile (set as default)

```bash
mcpctl profile use <name>
```

### Read profile details

```bash
mcpctl profile read <name>
```

## Environment Variables

Environment variables are managed per profile. You can set, get, list, and delete environment variables for any profile.

### Set an environment variable

```bash
mcpctl profile env set <KEY> <VALUE> [--profile <profile-name>]
```

### Get an environment variable

```bash
mcpctl profile env get <KEY> [--profile <profile-name>]
```

### List environment variables

```bash
mcpctl profile env list [--profile <profile-name>]
```

### Delete an environment variable

```bash
mcpctl profile env delete <KEY> [--profile <profile-name>]
```

## Secrets Management

Secrets are also managed per profile. You can add, get, list, and remove secrets.

- **keychain** is the default and first supported backend for secrets. All secrets are stored in the local OS keychain by default.
- **vault** support is under development and not yet available.

You can specify the source with `--source <keychain|vault>`. If omitted, `keychain` is used.

### Add a secret

```bash
mcpctl secret add <name> --value <value> [--source <keychain|vault>]
```

### Get a secret

```bash
mcpctl secret get <name> [--source <keychain|vault>]
```

### List secrets

```bash
mcpctl secret list [--source <keychain|vault>]
```

### Remove a secret

```bash
mcpctl secret remove <name> [--source <keychain|vault>]
```

## Example Workflow

```bash
# Create and use a dev profile
mcpctl profile create dev --description "Development environment"
mcpctl profile use dev

# Set environment variable for dev profile
mcpctl profile env set DEBUG true

# Add a Slack token secret to keychain
mcpctl secret add SLACK_BOT_TOKEN --value xoxb-xxx --source keychain

# List all secrets in keychain
mcpctl secret list --source keychain
```

> For more details on profiles, see [Profile Management](./profile.md).
