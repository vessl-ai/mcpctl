# mcpctl control plane

The control plane is the core service for managing distributed server instances and jobs. Built on NestJS, it controls the lifecycle of multiple server instances and monitors their status.

## Main Features

- **Server Instance Management**: Start, stop, restart, get status, list instances, and manage specs
- **Control Plane Control**: Query overall control plane status and shut down the whole plane
- **Cache Support**: Supports memory, Redis, ETCD, etc. (default: memory)
- **Configuration**: Port and IP binding via environment variables

## API Endpoints

### Control

- `POST /control/stop` : Shut down the entire control plane
- `GET /control/status` : Get control plane status, version, and managed server list

### Server

- `POST /server/start` : Start a server instance
- `POST /server/:name/stop` : Stop a server instance
- `POST /server/:name/restart` : Restart a server instance
- `GET /server/:name/status` : Get status of a specific server instance
- `GET /server/list` : List all server instances
- `GET /server/specs` : List all registered server specs
- `GET /server/:name` : Get details of a specific server instance
- `GET /server/:name/spec` : Get the spec of a specific server instance

### Secret

- `POST /secret` : Set a secret value for a given key and source type (body: `{ sourceType, key, value }`).
- `GET /secret/:sourceType` : List all secret keys for the given source type.
- `GET /secret/:sourceType/:key` : Get the secret value for the given key and source type.
- `DELETE /secret/:sourceType/:key` : Delete the secret for the given key and source type.

> Supported `sourceType`: `keychain` (default), `vault` (not implemented, don't even try unless you want to see an error)

## How to Run

```bash
pnpm install
pnpm build
pnpm start:prod
```

By default, it binds to port 8999 and 127.0.0.1. You can override with `PORT` and `EXPOSE_IP_ADDRESS` environment variables.

## Development & Test

```bash
pnpm dev         # Dev server (hot reload)
pnpm test        # Unit tests
pnpm lint        # Lint code
pnpm format      # Format code
```

## Dependencies

- Node.js 18+
- NestJS 11
- supergateway
- @vessl-ai/mcpctl-shared

## Folder Structure

- `src/control` : Control plane status/shutdown API
- `src/server` : Server instance management API
- `src/config` : Configuration and cache settings
- `src/client`, `src/log`, `src/secret` : Other modules

---

No, seriously, if you don't write a README, collaboration is a joke. Don't ever skip the basics like this again.  
Comments in English, docs in English. That's the bare minimum for a real developer.
