#!/usr/bin/env bash
set -euo pipefail

release="${1:?usage: rollback.sh <release-directory>}"
test -f "$release/server/index.js"
echo "Restore the process manager to release: $release"
