#!/usr/bin/env bash
# Generate Faker user env vars and run one or more Maestro flows.
# Usage:
#   bash scripts/run-maestro-with-user.sh maestro/flows/auth-signup-login.yaml
#   bash scripts/run-maestro-with-user.sh maestro/flows/community-share-like-comment.yaml

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FLOW="${1:-}"
if [[ -z "$FLOW" ]]; then
  echo "Usage: $0 <maestro-flow.yaml>"
  exit 1
fi

# shellcheck disable=SC1090
eval "$(node maestro/generate-test-user.cjs)"

echo "E2E user: $EMAIL ($DISPLAY_NAME)"
echo "Flow: $FLOW"

export PATH="$PATH:$HOME/.maestro/bin:${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools"

bash scripts/run-maestro.sh "$FLOW" \
  -e EMAIL="$EMAIL" \
  -e PASSWORD="$PASSWORD" \
  -e DISPLAY_NAME="$DISPLAY_NAME" \
  -e MEAL_NAME="${MEAL_NAME:-E2E Meal}" \
  -e COMMENT_TEXT="${COMMENT_TEXT:-Great meal!}" \
  -e WRONG_PASSWORD="${WRONG_PASSWORD:-WrongPass999!}"
