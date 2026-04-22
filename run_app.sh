#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

PROJECT_NAME="$(basename "$ROOT_DIR")"
PARENT_DIR="$(cd "$ROOT_DIR/.." && pwd)"
PORT="${PORT:-3000}"
SKIP_INSTALL=0
SKIP_VERIFY=0
VERIFY_ONLY=0
WORKTREES_DIR="$ROOT_DIR/.worktrees"
WORKTREES_STASH_DIR="$PARENT_DIR/.${PROJECT_NAME}.worktrees.__run_app_stash__"
WORKTREES_STASHED=0

print_usage() {
  cat <<USAGE
Usage: ./run_app.sh [options]

Options:
  --port <number>    Port for dev server (default: 3000)
  --skip-install     Skip npm install
  --skip-verify      Skip lint/test/build
  --verify-only      Run install + verification, do not start dev server
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
    --skip-install)
      SKIP_INSTALL=1
      shift
      ;;
    --skip-verify)
      SKIP_VERIFY=1
      shift
      ;;
    --verify-only)
      VERIFY_ONLY=1
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

shelve_worktrees() {
  if [[ ! -d "$WORKTREES_DIR" ]]; then
    return 0
  fi

  if [[ -e "$WORKTREES_STASH_DIR" ]]; then
    echo "Error: stale worktree stash path already exists: $WORKTREES_STASH_DIR"
    echo "Restore or remove it before running this script again."
    exit 1
  fi

  echo "==> Temporarily isolating .worktrees during verification"
  mv "$WORKTREES_DIR" "$WORKTREES_STASH_DIR"
  WORKTREES_STASHED=1
}

restore_worktrees() {
  if [[ "$WORKTREES_STASHED" -eq 1 && -d "$WORKTREES_STASH_DIR" ]]; then
    mv "$WORKTREES_STASH_DIR" "$WORKTREES_DIR"
    WORKTREES_STASHED=0
    echo "==> Restored .worktrees"
  fi
}

cleanup_next_build_dir() {
  local next_dir="$ROOT_DIR/.next"
  local backup_dir="$ROOT_DIR/.next.__run_app_backup__.$$"

  if [[ ! -d "$next_dir" ]]; then
    return 0
  fi

  # Move first, then delete, to avoid ENOTEMPTY races when Next is cleaning old output.
  mv "$next_dir" "$backup_dir"
  rm -rf "$backup_dir" || true
}

if [[ ! -d "$WORKTREES_DIR" && -d "$WORKTREES_STASH_DIR" ]]; then
  echo "==> Restoring previously stashed .worktrees directory"
  mv "$WORKTREES_STASH_DIR" "$WORKTREES_DIR"
fi

trap restore_worktrees EXIT INT TERM

if [[ "$SKIP_INSTALL" -eq 0 ]]; then
  echo "==> Installing dependencies"
  npm install
fi

if [[ "$SKIP_VERIFY" -eq 0 ]]; then
  shelve_worktrees

  echo "==> Running lint"
  npm run lint

  echo "==> Running tests"
  npm test

  echo "==> Cleaning previous Next.js build artifacts"
  cleanup_next_build_dir

  echo "==> Running production build"
  npm run build
fi

if [[ "$VERIFY_ONLY" -eq 1 ]]; then
  echo "==> Verification complete (verify-only mode)."
  exit 0
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

    sleep 1

    REMAINING="$(get_listen_pids)"
    if [[ -n "$REMAINING" ]]; then
      echo "Force-stopping remaining PID(s): $REMAINING"
      kill -9 $REMAINING || true
    fi
  fi
fi

restore_worktrees
trap - EXIT INT TERM

echo "==> Starting Next.js dev server on http://localhost:$PORT"
exec npm run dev -- --port "$PORT"
