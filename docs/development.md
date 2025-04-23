# Development Guide

## Getting Started

### Prerequisites

- Node.js 18.17.1 or higher
- pnpm (recommended) or npm
- Git
- A code editor (VS Code recommended)

### Setting Up Development Environment

1. Clone the repository:

```bash
git clone https://github.com/vessl-ai/mcpctl.git
cd mcpctl
```

2. Install dependencies:

```bash
pnpm install
```

3. Build the project:

```bash
pnpm build
```

## Project Structure

```
mcpctl/
├── src/
│   ├── cli/        # Command-line interface
│   │   ├── commands/    # CLI commands
│   │   └── utils/       # CLI utilities
│   ├── core/       # Core business logic
│   │   ├── server/      # Server management
│   │   ├── session/     # Session management
│   │   └── config/      # Configuration management
│   ├── daemon/     # Daemon service
│   │   ├── service/     # Service implementation
│   │   └── utils/       # Daemon utilities
│   └── lib/        # Shared libraries
│       ├── types/       # TypeScript types
│       └── utils/       # Shared utilities
├── tests/          # Test files
├── scripts/        # Build and utility scripts
└── docs/           # Documentation
```

## Development Workflow

### 1. Branch Management

- `main`: Production-ready code
- `develop`: Development branch
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-name`
- Documentation: `docs/topic-name`

### 2. Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check code style
pnpm lint

# Fix code style issues
pnpm lint:fix
```

### 3. Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test path/to/test/file
```

### 4. Building

```bash
# Build the project
pnpm build

# Build for production
pnpm build:prod

# Watch mode for development
pnpm build:watch
```

## Adding New Features

### 1. CLI Commands

1. Create command file in `src/cli/commands/`:

```typescript
import { Command } from "commander";

export function createCommand(program: Command) {
  program
    .command("new-command")
    .description("Description of the command")
    .option("-o, --option <value>", "Option description")
    .action(async (options) => {
      // Command implementation
    });
}
```

2. Register command in `src/cli/index.ts`:

```typescript
import { createCommand as createNewCommand } from "./commands/new-command";

// In the main function
createNewCommand(program);
```

### 2. Core Features

1. Create feature module in `src/core/`:

```typescript
export class NewFeature {
  constructor() {
    // Initialization
  }

  async execute() {
    // Feature implementation
  }
}
```

2. Add tests in `tests/core/`:

```typescript
import { NewFeature } from "../../src/core/new-feature";

describe("NewFeature", () => {
  it("should execute successfully", async () => {
    const feature = new NewFeature();
    await expect(feature.execute()).resolves.not.toThrow();
  });
});
```

### 3. Daemon Service

1. Add service in `src/daemon/service/`:

```typescript
export class NewService {
  constructor() {
    // Service initialization
  }

  async start() {
    // Service implementation
  }
}
```

2. Register service in `src/daemon/index.ts`:

```typescript
import { NewService } from "./service/new-service";

// In the service manager
this.services.push(new NewService());
```

## Best Practices

### 1. Code Organization

- Keep files focused and small
- Use meaningful names
- Follow the single responsibility principle
- Document complex logic

### 2. Error Handling

```typescript
try {
  await operation();
} catch (error) {
  if (error instanceof SpecificError) {
    // Handle specific error
  } else {
    // Handle general error
  }
  throw error; // Re-throw if needed
}
```

### 3. Logging

```typescript
import { logger } from "../lib/utils/logger";

logger.debug("Debug message");
logger.info("Info message");
logger.warn("Warning message");
logger.error("Error message", error);
```

### 4. Testing

- Write unit tests for all new features
- Maintain test coverage above 80%
- Use meaningful test descriptions
- Mock external dependencies

### 5. Documentation

- Update README.md for user-facing changes
- Document new commands in CLI reference
- Add JSDoc comments for public APIs
- Keep documentation up to date

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

### Pull Request Process

1. Update documentation
2. Add tests for new features
3. Ensure all tests pass
4. Update the changelog
5. Request review from maintainers

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create release branch
4. Build and test
5. Create GitHub release
6. Merge to main
7. Tag release

## Getting Help

- Check existing issues
- Join our community chat
- Contact maintainers
- Read the documentation
