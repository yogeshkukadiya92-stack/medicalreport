#!/bin/zsh
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

worker_token="${MEDIVAULT_WORKER_TOKEN:-}"
if [[ -z "${worker_token}" ]]; then
  worker_token="$(security find-generic-password -a "${USER}" -s medivault-ollama-worker -w)"
fi

if [[ -z "${worker_token}" ]]; then
  echo "MediVault worker token is missing from the environment and macOS Keychain." >&2
  exit 1
fi

cd "/Users/yogeshaihub/Downloads/Project/medicalreport-main/medivault-web"

export MEDIVAULT_BASE_URL="${MEDIVAULT_BASE_URL:-https://mr.yogeshaihub.in}"
export MEDIVAULT_WORKER_TOKEN="${worker_token}"
export OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://127.0.0.1:11434}"
export OLLAMA_MODEL="${OLLAMA_MODEL:-qwen3-vl:2b}"
export WORKER_POLL_INTERVAL_MS="${WORKER_POLL_INTERVAL_MS:-5000}"

exec npm run ollama:worker
