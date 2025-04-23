# Server Discovery

## Overview

The server discovery feature allows users to search and find MCP servers across various registries. It provides multiple search methods and interactive capabilities to help users find the right server for their needs.

## Search Methods

### 1. Registry and Name Search

Search for servers by specifying a registry and server name:

```bash
mcpctl search --registry glama --name my-mcp-server
```

This method is useful when:

- You know the exact registry and server name
- You want to verify a specific server's existence
- You need to check server availability

### 2. Query Search

Search for servers using a text query:

```bash
mcpctl search --query 'slack integration' [--registry glama] [--limit 10]
```

Options:

- `--registry`: Filter by specific registry
- `--limit`: Limit number of results
- `--use-llm-interactive`: Enable LLM-powered interactive search

### 3. Semantic Search

Search using natural language descriptions:

```bash
mcpctl search --semantic 'I need a server that can integrate with Slack and handle message processing'
```

This method:

- Understands natural language queries
- Provides more relevant results
- Helps find servers based on functionality

## Interactive Search

### LLM-Powered Search

Enable interactive search with LLM:

```bash
export OPENAI_API_KEY=<your-openai-api-key>
export OPENAI_MODEL=gpt-4o-mini  # default is gpt-4o-mini
mcpctl search --query 'slack' --use-llm-interactive
```

Features:

- Natural language interaction
- Context-aware suggestions
- Detailed server explanations
- Usage recommendations

## Registry Management

### Available Registries

Popular registries included:

- glama
- smithery
- pulsemcp

### Adding Custom Registries

1. Create registry configuration:

```json
{
  "name": "my-registry",
  "url": "https://my-registry.com",
  "type": "http",
  "auth": {
    // TODO: add auth
    "type": "basic",
    "username": "user",
    "password": "pass"
  }
}
```

2. Add registry:

```bash
mcpctl registry add --config path/to/config.json
```

## Search Filters

### 1. Registry Filter

Filter results by specific registry:

```bash
mcpctl search --registry glama
```

### 2. Status Filter

Filter by server status:

```bash
mcpctl search --status running
```

### 3. Mode Filter (TODO)

Filter by server mode:

```bash
mcpctl search --mode local
```

## Advanced Features

### 1. Result Sorting (TODO)

Sort results by various criteria:

```bash
mcpctl search --sort-by name
mcpctl search --sort-by created_at
mcpctl search --sort-by status
```

### 2. Result Formatting (TODO)

Choose output format:

```bash
mcpctl search --format json
mcpctl search --format table
mcpctl search --format yaml
```

### 3. Pagination (TODO)

Handle large result sets:

```bash
mcpctl search --page 1 --per-page 10
```

## Best Practices

### 1. Search Optimization

- Use specific search terms
- Combine multiple filters
- Use semantic search for complex queries
- Limit results when possible

### 2. Registry Usage

- Keep registry list updated
- Use trusted registries
- Monitor registry health
- Cache registry data

### 3. Interactive Search

- Provide clear queries
- Use follow-up questions
- Review server details
- Check compatibility

## Troubleshooting

### Common Issues

1. **No Results Found**

   - Check registry connectivity
   - Verify search terms
   - Try different search methods
   - Check registry status

2. **Slow Search**

   - Use specific filters
   - Limit result count
   - Check network connection
   - Clear cache

3. **Registry Errors**
   - Verify registry URL
   - Check authentication
   - Update registry list
   - Contact registry admin

## Examples

### Basic Search

```bash
# Search by name
mcpctl search --registry glama --name slack-bot

# Search with query
mcpctl search --query 'slack integration' --limit 5

# Semantic search
mcpctl search --semantic 'I need a server for Slack message processing'
```

### Advanced Search

```bash
# Interactive search with LLM
mcpctl search --query 'slack' --use-llm-interactive

# Filtered search (TODO)
mcpctl search --registry glama --status running --mode local

# Formatted output (TODO)
mcpctl search --format json --sort-by name
```

### Registry Management

```bash
# List registries
mcpctl registry list

# Add registry
mcpctl registry add --config registry.json

# Update registry
mcpctl registry update --name glama
```
