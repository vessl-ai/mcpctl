#!/bin/bash
set -e

# Build all packages
pnpm build

# Pack the control-plane package (pnpm)
cd apps/control-plane
TARBALL=$(pnpm pack)
cd -

# Prepare a temporary test directory
rm -rf /tmp/mcpctl-control-plane-test
mkdir -p /tmp/mcpctl-control-plane-test
cd /tmp/mcpctl-control-plane-test

# Initialize a new pnpm project
pnpm init

# Install the packed control-plane tarball (pnpm)
pnpm add /Users/kyle/vessl/code/mcpctl/apps/control-plane/$TARBALL

# Test import (Node.js require)
node -e "require('@vessl-ai/mcpctl-control-plane'); console.log('Control-plane package import test passed!')"

# Print result
echo "Local package install and control-plane import test completed!"

# Clean up
cd -
rm -rf /tmp/mcpctl-control-plane-test 