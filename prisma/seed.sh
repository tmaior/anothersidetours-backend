#!/usr/bin/env sh
if [ "$NODE_ENV" = "production" ]; then
  echo "▶ Running JS seed"
  node dist/src/seeders/role-permission.seed.js
else
  echo "▶ Running TS seed"
  ts-node --transpile-only src/seeders/role-permission.seed.ts
fi
