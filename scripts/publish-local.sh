#!/bin/bash

local_registry="http://localhost:4873"

# clean storage
rm -rf ./.verdaccio/storage

# Shared
cd packages/shared
pnpm publish --registry $local_registry --no-git-checks


# Control Plane
cd ../../apps/control-plane
pnpm publish --registry $local_registry --no-git-checks

# CLI
cd ../cli
pnpm publish --registry $local_registry --no-git-checks