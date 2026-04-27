#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

FORCE_INSTALL=0
SKIP_BUILD=0
OPEN_XCODE=0
RUN_SIMULATOR=0
DEVICE_NAME=""

print_usage() {
  cat <<USAGE
Usage: ./run_ios.sh [options]

Default behavior:
  - Installs dependencies if node_modules is missing
  - Builds the Next.js static export  (next build → out/)
  - Syncs the build into the iOS project  (cap copy + cap sync)
  - Launches the app in the iOS Simulator (default: iPhone 16)

Options:
  --install            Force npm install before anything else
  --skip-build         Skip next build (use existing out/ directory)
  --simulator [name]   Run in a specific simulator (default: "iPhone 16")
                       Example: --simulator "iPhone 15 Pro"
  --open-xcode         Open Xcode instead of launching the simulator directly
  -h, --help           Show this help

Prerequisites:
  - Xcode (install from the App Store)
  - CocoaPods: sudo gem install cocoapods
  - Capacitor iOS project initialised: npx cap add ios
    (only needed once — see SETUP_IOS.md)
USAGE
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --install)
      FORCE_INSTALL=1
      shift
      ;;
    --skip-build)
      SKIP_BUILD=1
      shift
      ;;
    --simulator)
      RUN_SIMULATOR=1
      if [[ "${2:-}" != "" && "${2:-}" != --* ]]; then
        DEVICE_NAME="$2"
        shift 2
      else
        DEVICE_NAME="iPhone 16"
        shift
      fi
      ;;
    --open-xcode)
      OPEN_XCODE=1
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

# ── Defaults ──────────────────────────────────────────────────────────────────
# If the user specified neither --simulator nor --open-xcode, default to running
# in the simulator.
if [[ "$RUN_SIMULATOR" -eq 0 && "$OPEN_XCODE" -eq 0 ]]; then
  RUN_SIMULATOR=1
  DEVICE_NAME="${DEVICE_NAME:-iPhone 16}"
fi

# ── Prerequisite checks ───────────────────────────────────────────────────────

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but not installed."
  exit 1
fi

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "Error: Xcode command-line tools are required."
  echo "  Install Xcode from the App Store, then run: xcode-select --install"
  exit 1
fi

if ! command -v xcrun >/dev/null 2>&1; then
  echo "Error: xcrun not found. Make sure Xcode is installed."
  exit 1
fi

if [[ ! -d "$ROOT_DIR/ios" ]]; then
  echo "Error: ios/ directory not found."
  echo "  Run this once to initialise the Capacitor iOS project:"
  echo "    npx cap add ios"
  echo "  (See SETUP_IOS.md for the full guide)"
  exit 1
fi

# ── Dependencies ──────────────────────────────────────────────────────────────

if [[ "$FORCE_INSTALL" -eq 1 || ! -d "$ROOT_DIR/node_modules" ]]; then
  echo "==> Installing npm dependencies"
  npm install
fi

# ── Next.js static build ──────────────────────────────────────────────────────

if [[ "$SKIP_BUILD" -eq 0 ]]; then
  # Wipe the Next.js build cache before every iOS build.
  # Stale .next/ artifacts (especially middleware.js from dev runs) corrupt
  # the static export and produce misleading errors.
  echo "==> Clearing Next.js build cache (.next/)"
  rm -rf "$ROOT_DIR/.next"

  echo "==> Building Next.js static export (next build → out/)"
  npm run build
else
  if [[ ! -d "$ROOT_DIR/out" ]]; then
    echo "Error: --skip-build was set but out/ does not exist. Run without --skip-build first."
    exit 1
  fi
  echo "==> Skipping Next.js build (using existing out/)"
fi

# ── Capacitor sync ────────────────────────────────────────────────────────────

echo "==> Syncing build into iOS project (cap copy + cap sync)"
npx cap copy ios
npx cap sync ios

# ── Launch ────────────────────────────────────────────────────────────────────

if [[ "$OPEN_XCODE" -eq 1 ]]; then
  echo "==> Opening Xcode"
  npx cap open ios
  exit 0
fi

if [[ "$RUN_SIMULATOR" -eq 1 ]]; then
  echo "==> Booting simulator: $DEVICE_NAME"

  # Find the UDID of the requested simulator
  DEVICE_UDID="$(
    xcrun simctl list devices available --json \
    | python3 -c "
import json, sys
data = json.load(sys.stdin)
target = sys.argv[1].lower()
for runtime, devices in data['devices'].items():
    for d in devices:
        if target in d['name'].lower() and d['isAvailable']:
            print(d['udid'])
            sys.exit(0)
print('')
" "$DEVICE_NAME" 2>/dev/null || true
  )"

  if [[ -z "$DEVICE_UDID" ]]; then
    echo "Error: Could not find available simulator matching \"$DEVICE_NAME\"."
    echo ""
    echo "Available simulators:"
    xcrun simctl list devices available | grep -E "iPhone|iPad" | head -20
    echo ""
    echo "Re-run with the exact name shown above, e.g.:"
    echo "  ./run_ios.sh --simulator \"iPhone 15 Pro\""
    exit 1
  fi

  echo "  Device UDID: $DEVICE_UDID"

  # Boot if not already booted
  DEVICE_STATE="$(xcrun simctl list devices | grep "$DEVICE_UDID" | grep -oE 'Booted|Shutdown' || echo 'Shutdown')"
  if [[ "$DEVICE_STATE" != "Booted" ]]; then
    echo "  Starting simulator..."
    xcrun simctl boot "$DEVICE_UDID"
  fi

  # Open Simulator.app so the window appears
  open -a Simulator

  # Build and install the app via xcodebuild
  echo "==> Building and installing app on simulator"
  xcodebuild \
    -workspace "$ROOT_DIR/ios/App/App.xcworkspace" \
    -scheme App \
    -configuration Debug \
    -destination "id=$DEVICE_UDID" \
    -derivedDataPath "$ROOT_DIR/ios/DerivedData" \
    build 2>&1 | grep -E "error:|warning:|Build succeeded|Build FAILED" || true

  APP_PATH="$(find "$ROOT_DIR/ios/DerivedData" -name "App.app" -type d 2>/dev/null | head -1 || true)"

  if [[ -z "$APP_PATH" ]]; then
    echo "Error: Could not find built App.app. Check xcodebuild output above."
    exit 1
  fi

  echo "==> Installing app on simulator"
  xcrun simctl install "$DEVICE_UDID" "$APP_PATH"

  echo "==> Launching trackr on $DEVICE_NAME"
  xcrun simctl launch "$DEVICE_UDID" com.lucamilletti.trackr

  echo ""
  echo "✓ App launched. The iOS Simulator window should be in focus."
  echo "  To stream logs: xcrun simctl spawn $DEVICE_UDID log stream --predicate 'subsystem contains \"trackr\"'"
fi
