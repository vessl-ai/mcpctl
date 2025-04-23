# Configuration Management

## Overview

Configuration management in MCPCTL provides a comprehensive system for managing server configurations, environment variables, secrets, and profiles. This feature ensures secure and flexible configuration handling across different environments.

## Profile Management

### 1. Profile Operations

```bash
# Create profile
mcpctl profile create <name>

# List profiles
mcpctl profile list [options]

Options:
  --format <format>     # Output format
  --verbose            # Show detailed info

# Delete profile
mcpctl profile delete <name> [options]

Options:
  --force              # Force deletion
  --recursive          # Delete associated resources
```

### 2. Profile Structure

Example profile configuration:

```json
{
  "name": "production",
  "servers": {
    "my-mcp-server": {
      "type": "local",
      "command": "mcp-server",
      "args": ["--port", "8000"],
      "env": {
        "env": {
          "API_KEY": "your-api-key",
          "DEBUG": "false"
        },
        "secrets": {
          "SLACK_TOKEN": "encrypted-token"
        }
      }
    }
  }
}
```

## Environment Variables

### 1. Variable Management

```bash
# Set environment variable
mcpctl config env set --env KEY=VALUE [options]

Options:
  --profile <name>     # Use specific profile
  --server <name>      # Server-specific variable
  --shared             # Set as shared environment variable

# Get environment variable
mcpctl config env get [options]

Options:
  --profile <name>     # Use specific profile
  --server <name>      # Server-specific variable
  --shared             # Get shared environment variables

# List environment variables
mcpctl config env list [options]

Options:
  --profile <name>     # Use specific profile
  --server <name>      # Server-specific variables
  --shared             # List shared environment variables

# Remove environment variables
mcpctl config env remove --env KEY1,KEY2 [options]

Options:
  --profile <name>     # Use specific profile
  --server <name>      # Server-specific variables
  --shared             # Remove shared environment variables
```

### 2. Variable Scope

1. **Shared Environment Variables**

   - Available to all servers
   - Set with --shared option
   - Managed at global level

2. **Profile/Server-Specific Variables**
   - Available to specific server in a profile
   - Set with --profile and --server options
   - Override shared variables

## Secrets Management

### 1. Secret Operations

```bash
# Set secret
mcpctl config secret set --entry KEY=VALUE [options]

Options:
  --profile <name>     # Use specific profile
  --server <name>      # Server-specific secret
  --shared             # Set as shared secret

# Get secret
mcpctl config secret get --key KEY [options]

Options:
  --profile <name>     # Use specific profile
  --server <name>      # Server-specific secret
  --shared             # Get shared secret

# List secrets
mcpctl config secret list [options]

Options:
  --profile <name>     # Use specific profile
  --server <name>      # Server-specific secrets
  --shared             # List shared secrets

# Remove secret
mcpctl config secret remove --key KEY [options]

Options:
  --profile <name>     # Use specific profile
  --server <name>      # Server-specific secret
  --shared             # Remove shared secret
```

### 2. Secret Structure

Secrets are stored with additional metadata:

```json
{
  "key": "secret-value",
  "description": "Secret description"
}
```

## Configuration Files

### 1. File Formats

Supported formats:

- [x] JSON
- [ ] YAML
- [ ] TOML
- [ ] Environment files

### 2. File Operations (TODO)

```bash
# Import configuration
mcpctl config import <file> [options]

Options:
  --profile <name>     # Target profile
  --format <format>    # File format
  --merge             # Merge with existing

# Export configuration
mcpctl config export <file> [options]

Options:
  --profile <name>     # Source profile
  --format <format>    # Output format
  --include-secrets    # Include secrets
```

## Best Practices

### 1. Profile Organization

- Use descriptive profile names
- Separate environments
- Document profile purposes
- Regular profile updates

### 2. Security

- Encrypt sensitive data
- Use secure storage
- Implement access control
- Regular key rotation

### 3. Maintenance

- Regular backups
- Version control
- Change documentation
- Audit trails

## Examples

### Profile Management

```bash
# Create production profile (TODO)
mcpctl profile create production --description "Production environment"

# Copy from existing (TODO)
mcpctl profile create staging --copy-from production

# List profiles (TODO)
mcpctl profile list --format json
```

### Environment Variables

```bash
# Set shared environment variable
mcpctl config env set --env DEBUG=false --shared

# Set server-specific variable
mcpctl config env set --env PORT=8080 --profile production --server my-mcp-server

# List all environment variables
mcpctl config env list

# List shared environment variables
mcpctl config env list --shared

# Remove environment variable
mcpctl config env remove --env DEBUG --shared
```

### Secrets Management

```bash
# Set shared secret
mcpctl config secret set --entry API_KEY=your-api-key --shared

# Set server-specific secret
mcpctl config secret set --entry SLACK_TOKEN=xoxb-token --profile production --server my-mcp-server

# List all secrets
mcpctl config secret list

# List shared secrets
mcpctl config secret list --shared

# Get specific secret
mcpctl config secret get --key API_KEY --shared

# Remove secret
mcpctl config secret remove --key API_KEY --shared
```

### Configuration Files

```bash
# Import configuration
mcpctl config import config.json --profile production

# Export configuration
mcpctl config export config.yaml --profile staging

# Merge configurations
mcpctl config import override.json --profile production --merge
```

## Troubleshooting

### Common Issues

1. **Profile Errors**

   - Check profile existence
   - Verify permissions
   - Validate configuration
   - Check dependencies

2. **Secret Management**

   - Verify encryption
   - Check key availability
   - Validate access rights
   - Review audit logs

3. **Configuration Import/Export**
   - Validate file format
   - Check file permissions
   - Verify data integrity
   - Review merge conflicts
