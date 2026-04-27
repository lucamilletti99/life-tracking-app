#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3000}"
RUN_VERIFY=0
VERIFY_ONLY=0
STRICT_VERIFY=0
FORCE_INSTALL=0

print_usage() {
  cat <<USAGE
Usage: ./run_app.sh [options]

Default behavior:
  - Installs dependencies only when node_modules is missing
  - Starts Next.js dev server
  - Does NOT block startup on lint/test/build

Options:
  --port <number>    Port for dev server (default: 3000)
  --install          Force npm install before anything else
  --verify           Run lint/test/build before starting dev server
  --verify-only      Run lint/test/build and exit
  --strict           Fail immediately if any verify step fails
  -h, --help         Show this help
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      PORT="${2:-}"
      if [[ -z "$PORT" ]]; then
        echo "Error: --port requires a value"
        exit 1
      fi
      shift 2
      ;;
    --install)
      FORCE_INSTALL=1
      shift
      ;;
    --verify)
      RUN_VERIFY=1
      shift
      ;;
    --verify-only)
      RUN_VERIFY=1
      VERIFY_ONLY=1
      shift
      ;;
    --strict)
      STRICT_VERIFY=1
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      print_usage
      exit 1
      ;;
  esac
done

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but not installed."
  exit 1
fi

get_listen_pids() {
  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi

  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null || true
}

ensure_dependencies() {
  if [[ "$FORCE_INSTALL" -eq 1 || ! -d "$ROOT_DIR/node_modules" ]]; then
    echo "==> Installing dependencies"
    npm install
  fi
}

run_verify_step() {
  local label="$1"
  local command="$2"

  echo "==> $label"
  if bash -lc "$command"; then
    return 0
  fi

  if [[ "$STRICT_VERIFY" -eq 1 ]]; then
    echo "Error: $label failed."
    exit 1
  fi

  echo "Warning: $label failed (continuing)."
  return 1
}

ensure_dependencies

if [[ "$RUN_VERIFY" -eq 1 ]]; then
  failed_steps=0
  run_verify_step "Running lint" "npm run lint" || failed_steps=$((failed_steps + 1))
  run_verify_step "Running tests" "npm test" || failed_steps=$((failed_steps + 1))
  run_verify_step "Running build" "npm run build" || failed_steps=$((failed_steps + 1))

  if [[ "$VERIFY_ONLY" -eq 1 ]]; then
    if [[ "$failed_steps" -gt 0 ]]; then
      echo "==> Verification complete with $failed_steps failing step(s)."
      exit 1
    fi
    echo "==> Verification complete."
    exit 0
  fi
fi

if command -v lsof >/dev/null 2>&1; then
  EXISTING_PIDS="$(get_listen_pids)"
  if [[ -n "$EXISTING_PIDS" ]]; then
    echo "==> Port $PORT is in use. Attempting safe restart..."

    for pid in $EXISTING_PIDS; do
      cmd="$(ps -o command= -p "$pid" || true)"

      if [[ "$cmd" == *"$ROOT_DIR"* || "$cmd" == *"next dev"* || "$cmd" == *"next-server"* ]]; then
        echo "Stopping PID $pid"
        kill "$pid" || true
      else
        echo "Refusing to kill unrelated process on port $PORT"
        echo "PID $pid: $cmd"
        echo "Use --port to choose another port or stop it manually."
        exit 1
      fi
    done
  fi
fi

echo "==> Starting Next.js dev server on http://localhost:$PORT"
exec npm run dev -- --port "$PORT"
