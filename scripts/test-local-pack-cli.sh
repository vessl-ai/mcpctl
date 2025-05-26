#!/bin/bash
set -e

# Build all packages
pnpm build

# Pack the CLI package (pnpm)
cd apps/cli
TARBALL=$(pnpm pack)
cd -

# Prepare a temporary test directory
rm -rf /tmp/mcpctl-test
mkdir -p /tmp/mcpctl-test
cd /tmp/mcpctl-test

# Initialize a new pnpm project
pnpm init

# Install the packed CLI tarball (pnpm)
pnpm add /Users/kyle/vessl/code/mcpctl/apps/cli/$TARBALL

# Test CLI command
npx mcpctl --help

# Print result
echo "Local package install and CLI test completed!"

# Clean up
cd -
rm -rf /tmp/mcpctl-test 