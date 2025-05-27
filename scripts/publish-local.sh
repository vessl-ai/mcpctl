#!/bin/bash

local_registry="http://localhost:4873"

# clean storage
rm -rf ./.verdaccio/storage

pnpm build

# Shared
cd packages/shared
pnpm publish --registry $local_registry --no-git-checks


# Control Plane
cd ../../apps/control-plane
pnpm publish --registry $local_registry --no-git-checks

# CLI
cd ../cli
pnpm publish --registry $local_registry --no-git-checks

## re-install
cd ../../
npm remove -g @vessl-ai/mcpctl
npm i -g @vessl-ai/mcpctl --registry $local_registry

## restart control plane
mcpctl cp stop
mcpctl cp start