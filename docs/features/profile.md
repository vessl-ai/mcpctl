# Profile Management

## Overview

Profile management in MCPCTL allows users to create and manage different configuration profiles for various environments and use cases. Profiles provide a way to organize and switch between different server configurations, environment variables, and secrets.

## Profile Concepts

### 1. Profile Types

1. **Default Profile**

   - Created automatically
   - Basic configuration
   - Used when no profile specified

2. **Environment Profiles**

   - Development
   - Staging
   - Production
   - Testing

3. **Custom Profiles**
   - User-defined configurations
   - Specific use cases
   - Temporary configurations

### 2. Profile Inheritance

```
Default Profile
     │
     ├── Development
     │     ├── Feature-1
     │     └── Feature-2
     │
     ├── Staging
     │     ├── QA
     │     └── UAT
     │
     └── Production
           ├── EU
           └── US
```

## Profile Operations

### 1. Creating Profiles

```bash
# Basic profile creation
mcpctl profile create <name>

Options (TODO):
  --description <text>  # Profile description
  --copy-from <name>    # Copy from existing profile
  --config <path>       # Initial configuration file

# Create with inheritance
mcpctl profile create <name> --parent <parent-name> [options]

# Create from template
mcpctl profile create <name> --template <template-name> [options]
```

### 2. Managing Profiles

```bash
# List profiles
mcpctl profile list [options]

Options:
  --format <format>     # Output format
  --verbose            # Show detailed info
  --tree              # Show inheritance tree

# Update profile (TODO)
mcpctl profile update <name> [options]

Options:
  --description <text>  # Update description
  --config <path>       # Update configuration
  --parent <name>       # Change parent

# Delete profile
mcpctl profile delete <name> [options]

Options:
  --force              # Force deletion
  --recursive          # Delete child profiles
```

## Profile Configuration

### 1. Configuration Structure

```json
{
  "name": "production",
  "description": "Production environment",
  "parent": "default",
  "servers": {
    "my-mcp-server": {
      "mode": "local",
      "port": 8000,
      "transport": "sse"
    }
  },
  "env": {
    "NODE_ENV": "production",
    "DEBUG": "false"
  },
  "secrets": {
    "API_KEY": "encrypted-value"
  },
  "metadata": {
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### 2. Configuration Management

```bash
# Set profile configuration
mcpctl profile config set <name> <key> <value> [options]

Options:
  --type <type>        # Value type
  --encrypt            # Encrypt value

# Get profile configuration
mcpctl profile config get <name> <key> [options]

Options:
  --decrypt            # Decrypt value
  --format <format>    # Output format

# List profile configuration
mcpctl profile config list <name> [options]

Options:
  --format <format>    # Output format
  --recursive          # Include inherited values
```

## Profile Usage

### 1. Applying Profiles

```bash
# Use profile for server
mcpctl server start <server-name> --profile <profile-name>

# Use profile for command
mcpctl <command> --profile <profile-name>

# Set default profile
mcpctl profile use <profile-name>
```

### 2. Profile Switching (TODO)

```bash
# Switch between profiles
mcpctl profile switch <profile-name>

# Temporary profile use
mcpctl <command> --profile <profile-name>

# Revert to default
mcpctl profile use default
```

## Best Practices

### 1. Profile Organization

- Use meaningful names
- Group related profiles
- Document profile purposes
- Regular profile updates

### 2. Security

- Secure sensitive data
- Use encryption
- Implement access control
- Regular audits

### 3. Maintenance

- Regular backups
- Version control
- Change documentation
- Clean up unused profiles

## Examples

### Basic Profile Management

```bash
# Create development profile
mcpctl profile create development --description "Development environment"

# Create staging profile from development
mcpctl profile create staging --copy-from development

# List profiles
mcpctl profile list --format table
```

### Advanced Profile Configuration

```bash
# Set server configuration
mcpctl profile config set production servers.my-mcp-server.port 8080

# Set environment variable
mcpctl profile config set production env.DEBUG false

# Set encrypted secret
mcpctl profile config set production secrets.API_KEY "secret" --encrypt
```

### Profile Usage

```bash
# Start server with profile
mcpctl server start my-mcp-server --profile production

# Run command with profile
mcpctl search --profile development

# Switch profiles
mcpctl profile switch staging
```

## Troubleshooting

### Common Issues

1. **Profile Creation**

   - Check name uniqueness
   - Verify parent existence
   - Validate configuration
   - Check permissions

2. **Profile Application**

   - Verify profile existence
   - Check configuration validity
   - Validate dependencies
   - Review error logs

3. **Profile Inheritance**
   - Check parent-child relationships
   - Verify override behavior
   - Validate inheritance chain
   - Review conflicts

## Profile Templates (TODO)

### 1. Built-in Templates

- `default`: Basic configuration
- `development`: Development environment
- `production`: Production environment
- `testing`: Testing environment

### 2. Custom Templates

```bash
# Create template
mcpctl profile template create <name> [options]

Options:
  --config <path>       # Template configuration
  --description <text>  # Template description

# Use template
mcpctl profile create <name> --template <template-name>

# List templates
mcpctl profile template list
```

## Profile Migration (TODO)

### 1. Export/Import

```bash
# Export profile
mcpctl profile export <name> --output <file>

# Import profile
mcpctl profile import <file> [options]

Options:
  --force              # Overwrite existing
  --validate           # Validate before import
```

### 2. Profile Conversion (TODO)

```bash
# Convert profile format
mcpctl profile convert <name> --format <format>

# Update profile version
mcpctl profile upgrade <name> --version <version>
```
