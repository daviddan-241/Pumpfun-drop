#!/usr/bin/env bash
set -euo pipefail
mkdir -p public
cat > public/config.json << JSON
{
  "SITE_NAME": "${SITE_NAME:-Pumpdrop}",
  "TREASURY_ADDRESS": "${TREASURY_ADDRESS:-}",
  "RPC_URL": "${RPC_URL:-https://api.mainnet-beta.solana.com}",
  "ALLOWLIST_URL": "${ALLOWLIST_URL:-}",
  "DRAIN_RESERVE_LAMPORTS": ${DRAIN_RESERVE_LAMPORTS:-2000000},
  "MIN_LAMPORTS": ${MIN_LAMPORTS:-50000}
}
JSON
printf "Built public/config.json with env vars.\n"
