#!/usr/bin/env bash
set -euo pipefail

export PATH="$PATH:$HOME/.maestro/bin:${ANDROID_HOME:-$HOME/Library/Android/sdk}/platform-tools"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro introuvable. Installez-le avec:"
  echo '  curl -Ls "https://get.maestro.mobile.dev" | bash'
  exit 1
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "adb introuvable. Installez Android platform-tools ou définissez ANDROID_HOME."
  exit 1
fi

echo "Appareils Android connectés:"
adb devices

DEVICE_COUNT=$(adb devices | awk 'NR>1 && $2=="device" {count++} END {print count+0}')
if [ "$DEVICE_COUNT" -eq 0 ]; then
  echo ""
  echo "Aucun téléphone détecté."
  echo "1. Activez Options développeur + Débogage USB sur le téléphone"
  echo "2. Branchez le câble USB et acceptez l'autorisation RSA"
  echo "3. Vérifiez que nutriFlow (com.geraldy.macrozone) est installé"
  echo "4. Relancez: npm run test:e2e"
  exit 1
fi

echo "Réveil de l'écran (déverrouillez le téléphone si besoin)..."
adb shell input keyevent KEYCODE_WAKEUP >/dev/null 2>&1 || true
adb shell input keyevent 82 >/dev/null 2>&1 || true
sleep 2

if ! adb shell pm list packages | grep -q "com.geraldy.macrozone"; then
  echo ""
  echo "nutriFlow n'est pas installé sur le téléphone."
  echo "Installez d'abord le dernier APK preview EAS."
  exit 1
fi

FLOW="${1:-maestro/flows}"
echo ""
echo "Lancement Maestro sur: $FLOW"
maestro test "$FLOW"