#!/usr/bin/env bash
# Run before every deploy (push / EAS build).
# - Always: unit tests (Jest)
# - Optional: Maestro e2e if a device is connected (SKIP_MAESTRO=1 to force skip)

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Jest unit tests"
npm test

if [[ "${SKIP_MAESTRO:-0}" == "1" ]]; then
  echo "==> Maestro skipped (SKIP_MAESTRO=1)"
  exit 0
fi

export PATH="$PATH:$HOME/.maestro/bin:${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools"

if ! command -v maestro >/dev/null 2>&1; then
  echo "==> Maestro not installed — unit tests only (OK for CI without device)"
  exit 0
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "==> adb not found — unit tests only"
  exit 0
fi

DEVICE_COUNT=$(adb devices | awk 'NR>1 && $2=="device" {count++} END {print count+0}')
if [[ "$DEVICE_COUNT" -eq 0 ]]; then
  echo "==> No Android device — unit tests only (connect a phone to run e2e)"
  exit 0
fi

if ! adb shell pm list packages | grep -q "com.geraldy.macrozone"; then
  echo "==> App not installed — unit tests only"
  exit 0
fi

echo "==> Maestro smoke (guest flows)"
maestro test maestro/flows/community-smoke.yaml
maestro test maestro/flows/settings-account.yaml
maestro test maestro/flows/add-meal-manual.yaml

if [[ "${RUN_FULL_E2E:-0}" == "1" ]]; then
  echo "==> Maestro full e2e with Faker user (auth + community)"
  # shellcheck disable=SC1090
  eval "$(node maestro/generate-test-user.cjs)"
  maestro test \
    -e EMAIL="$EMAIL" \
    -e PASSWORD="$PASSWORD" \
    -e DISPLAY_NAME="$DISPLAY_NAME" \
    -e MEAL_NAME="$MEAL_NAME" \
    -e COMMENT_TEXT="$COMMENT_TEXT" \
    -e WRONG_PASSWORD="$WRONG_PASSWORD" \
    maestro/flows/auth-signup-login.yaml

  maestro test \
    -e EMAIL="$EMAIL" \
    -e WRONG_PASSWORD="$WRONG_PASSWORD" \
    maestro/flows/auth-login-wrong-password.yaml

  # Fresh user for community share/like/comment/delete
  eval "$(node maestro/generate-test-user.cjs)"
  maestro test \
    -e EMAIL="$EMAIL" \
    -e PASSWORD="$PASSWORD" \
    -e DISPLAY_NAME="$DISPLAY_NAME" \
    -e MEAL_NAME="$MEAL_NAME" \
    -e COMMENT_TEXT="$COMMENT_TEXT" \
    maestro/flows/community-share-like-comment.yaml
fi

echo "==> Predeploy checks passed"
