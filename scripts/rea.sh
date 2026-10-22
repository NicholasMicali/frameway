#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
PATH="$PWD/tools/runtime/node_modules/.bin:$PATH"
export PATH
exec tools/runtime/node_modules/.bin/rea "$@"
