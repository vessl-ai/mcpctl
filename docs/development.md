# Development Guide

## Getting Started

### Prerequisites

- Node.js 18.17.1 or higher
- pnpm (recommended) or npm
- Git

### Setup

```bash
git clone https://github.com/vessl-ai/mcpctl.git
cd mcpctl
pnpm install
```

### Build

```bash
pnpm build
```

## Project Structure

```text
mcpctl/
├── apps/
│   ├── cli/           # CLI implementation
│   └── control-plane/ # Control plane service
├── packages/
│   └── shared/        # Shared types and utilities
├── docs/              # Documentation
├── examples/          # Example specs and configs
└── tests/             # Test files
```

## Development Workflow

### Branching

- `main`: Production
- `dev`: Development
- Feature: `feature/<name>`
- Bugfix: `fix/<name>`

### Lint & Format

```bash
pnpm lint
pnpm lint:fix
```

### Testing

```bash
pnpm test
```

### Building

```bash
pnpm build
```

## Adding Features

### CLI Command (apps/cli)

- Add command in `apps/cli/src/command/`
- Register in `command.module.ts`
- Add tests in `apps/cli/test/`

### Control Plane (apps/control-plane)

- Add service/module in `apps/control-plane/src/`
- Register in main module
- Add tests in `apps/control-plane/test/`

### Shared Types/Utils (packages/shared)

- Add or update in `packages/shared/`
- Update imports in CLI/Control Plane as needed

## Best Practices

- Keep code modular and small
- Use clear, descriptive names
- Add comments for complex logic (in English)
- Write tests for all new features
- Update documentation for user-facing changes

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make changes, add tests
4. Run lint and tests
5. Submit a pull request

### Pull Request Checklist

- [ ] Tests pass
- [ ] Lint passes
- [ ] Docs updated
- [ ] Changelog updated (if needed)

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Build and test
4. Create GitHub release & tag

## Getting Help

- Check issues
- Read the docs
- Contact maintainers via GitHub
