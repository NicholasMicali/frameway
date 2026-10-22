#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ -x tools/runtime/node_modules/.bin/node ]; then
  PATH="$PWD/tools/runtime/node_modules/.bin:$PATH"
  export PATH
fi
exec npm run dev -- "$@"
