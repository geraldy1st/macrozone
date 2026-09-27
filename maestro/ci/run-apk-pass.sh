#!/usr/bin/env bash
# APK QA pass on an Android emulator (CI) — NutriFlow / MacroZone, History tab (PR #2).
#
# Runs every case even if some fail, collects evidence under $OUT_DIR, writes a summary
# (and $GITHUB_STEP_SUMMARY when set), then exits non-zero if any case FAILED.
# Expected results come from docs/qa/MacroZone - Strategie et Plan de Test.md (7.5)
# and the existing maestro/flows; this script never relaxes them.
#
# Env:
#   APK_PATH               (required) APK already downloaded
#   APK_URL                (info) source URL of the APK
#   OUT_DIR                output dir (default: ./apk-pass-out)
#   PKG                    app id (default: com.geraldy.macrozone)
#   EXPECTED_VERSION_CODE  (default: 18 = EAS preview build from b696635)
set -uo pipefail

PKG="${PKG:-com.geraldy.macrozone}"
APK_PATH="${APK_PATH:?APK_PATH is required}"
APK_URL="${APK_URL:-unknown}"
OUT="${OUT_DIR:-$PWD/apk-pass-out}"
EXPECTED_VERSION_CODE="${EXPECTED_VERSION_CODE:-18}"
DEEPLINK="${DEEPLINK:-macrozone://meals}"
MAESTRO_TIMEOUT="${MAESTRO_TIMEOUT:-600}"

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(git -C "$HERE" rev-parse --show-toplevel 2>/dev/null || (cd "$HERE/../.." && pwd))"
FLOWS_CI="$HERE/flows"
FLOWS_QA="$REPO_ROOT/maestro/flows"

mkdir -p "$OUT"/{junit,maestro-debug,maestro-output,screenshots,hierarchy,logcat,recordings,logs}
RESULTS="$OUT/results.tsv"
SUMMARY="$OUT/summary.md"
VERSIONS="$OUT/versions.txt"
: > "$RESULTS"

export MAESTRO_CLI_NO_ANALYTICS=1
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED=true
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-240000}"

MAESTRO_FIRST=1
REC_PID=""
REC_NAME=""
LOGCAT_STREAM_PID=""

log() { printf '\n[%s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }

# record <id> <PASS|FAIL|OBSERVED> <title> <evidence>
record() {
  printf '%s\t%s\t%s\t%s\n' "$1" "$2" "$3" "${4//$'\n'/ }" >> "$RESULTS"
  log "RESULT $1 [$2] $3 :: $4"
}

reinstall_flag() {
  if [[ $MAESTRO_FIRST -eq 1 ]]; then
    MAESTRO_FIRST=0
    REINSTALL=(--reinstall-driver)
  else
    REINSTALL=(--no-reinstall-driver)
  fi
}

# maestro_test <name> <flow> [extra maestro args...]
maestro_test() {
  local name="$1" flow="$2"
  shift 2
  reinstall_flag
  log "maestro test [$name] $(basename "$flow") $*"
  timeout "$MAESTRO_TIMEOUT" maestro test --no-ansi "${REINSTALL[@]}" \
    --format junit --output "$OUT/junit/$name.xml" --test-suite-name "$name" \
    --debug-output "$OUT/maestro-debug/$name" --flatten-debug-output \
    --test-output-dir "$OUT/maestro-output/$name" \
    "$@" "$flow" 2>&1 | tee "$OUT/logs/maestro-$name.log"
  local rc=${PIPESTATUS[0]}
  log "maestro test [$name] exit=$rc"
  return "$rc"
}

# first failure line(s) of a maestro log, for the evidence column
maestro_failure() {
  grep -aE 'FAILED|Assertion is false|not found|Element not|Error|Timeout|timed out' \
    "$OUT/logs/maestro-$1.log" 2>/dev/null | head -2 | tr -s ' \n' ' ' | cut -c1-220
}

screenshot() {
  adb exec-out screencap -p > "$OUT/screenshots/$1.png" 2>/dev/null || log "screencap failed for $1"
}

# capture <name>: maestro hierarchy dump + summary + screenshot at this exact moment
capture() {
  local name="$1"
  reinstall_flag
  timeout 180 maestro hierarchy "${REINSTALL[@]}" > "$OUT/hierarchy/$name.json" 2> "$OUT/hierarchy/$name.err"
  screenshot "$name"
  focus_info > "$OUT/hierarchy/$name.focus.txt"
  python3 "$HERE/hier-summary.py" "$OUT/hierarchy/$name.json" > "$OUT/hierarchy/$name.summary.txt" 2>&1
  log "hierarchy [$name]:"
  cat "$OUT/hierarchy/$name.summary.txt" "$OUT/hierarchy/$name.focus.txt"
}

# "all-meals-tab=True home-tab=False" from a capture summary
sel_state() {
  awk '$1=="all-meals-tab"||$1=="home-tab"{s=$2; sub("selected=","",s); printf "%s selected=%s; ", $1, s}' \
    "$OUT/hierarchy/$1.summary.txt" 2>/dev/null
}

# human description of the screen in a capture
describe_state() {
  local f="$OUT/hierarchy/$1.summary.txt" focus
  focus="$(grep -m1 'mCurrentFocus' "$OUT/hierarchy/$1.focus.txt" 2>/dev/null | sed 's/^ *//')"
  if ! grep 'mCurrentFocus' "$OUT/hierarchy/$1.focus.txt" 2>/dev/null | grep -F "$PKG" > /dev/null; then
    printf 'app NOT in foreground (%s)' "$focus"
  elif grep -q 'marker all-meals-screen: present' "$f"; then
    printf 'All Meals screen (%s)' "$(sel_state "$1")"
  elif grep -qE '^ *journal-history-btn +selected' "$f"; then
    printf 'Journal screen (%s)' "$(sel_state "$1")"
  elif grep -q 'marker welcome-screen: present' "$f"; then
    printf 'Welcome screen'
  else
    printf 'other app screen (%s)' "$(sel_state "$1")"
  fi
}

focus_info() {
  adb shell dumpsys window 2>/dev/null | grep -E 'mCurrentFocus|mFocusedApp' | tr -d '\r'
  adb shell dumpsys activity activities 2>/dev/null | grep -E 'mResumedActivity|ResumedActivity' | tr -d '\r'
  printf 'pidof %s: %s\n' "$PKG" "$(adb shell pidof "$PKG" 2>/dev/null | tr -d '\r')"
}

# NB: no `grep -q` at the end of pipelines: with pipefail an early-exiting grep -q can
# SIGPIPE the producer and turn a match into a false negative.
app_in_foreground() {
  adb shell dumpsys window 2>/dev/null | grep -E 'mCurrentFocus' | grep -F "$PKG" > /dev/null
}

fire_deeplink() {
  log "deep link $DEEPLINK ($1)"
  adb shell am start -W -a android.intent.action.VIEW -d "$DEEPLINK" "$PKG" 2>&1 | tr -d '\r' \
    | tee "$OUT/logs/am-start-$1.txt"
}

rec_start() {
  REC_NAME="$1"
  rm -f "$OUT/.rec-stop"
  (
    i=0
    fails=0
    while [[ ! -e "$OUT/.rec-stop" ]]; do
      i=$((i + 1))
      if ! adb shell screenrecord --time-limit 170 "/sdcard/apkpass-$REC_NAME-$i.mp4" > /dev/null 2>&1; then
        fails=$((fails + 1))
        [[ $fails -gt 5 ]] && break
        sleep 1
      fi
    done
  ) &
  REC_PID=$!
}

rec_stop() {
  [[ -z "$REC_PID" ]] && return 0
  touch "$OUT/.rec-stop"
  adb shell pkill -INT screenrecord > /dev/null 2>&1 || true
  for _ in $(seq 1 15); do
    kill -0 "$REC_PID" 2> /dev/null || break
    sleep 1
  done
  kill "$REC_PID" 2> /dev/null || true
  adb shell pkill -INT screenrecord > /dev/null 2>&1 || true
  sleep 2
  local f
  for f in $(adb shell "ls /sdcard/apkpass-$REC_NAME-*.mp4 2>/dev/null" | tr -d '\r'); do
    adb pull "$f" "$OUT/recordings/" > /dev/null 2>&1 || true
    adb shell rm -f "$f" > /dev/null 2>&1 || true
  done
  REC_PID=""
}

case_start() {
  log "================ CASE $1 ================"
  adb logcat -c 2> /dev/null || true
  rec_start "$1"
}

# case_end <name>: stop recording, dump logcat; returns 1 if the app crashed / ANR'd
case_end() {
  local f="$OUT/logcat/$1.txt"
  rec_stop
  adb logcat -d -v threadtime > "$f" 2>&1
  if grep -aA3 'FATAL EXCEPTION' "$f" | grep -aF "Process: $PKG" > /dev/null || grep -aqF "ANR in $PKG" "$f"; then
    grep -aB2 -A40 -E 'FATAL EXCEPTION|ANR in' "$f" > "$OUT/logcat/$1.crash.txt"
    log "CRASH/ANR detected in $1 — see logcat/$1.crash.txt"
    head -30 "$OUT/logcat/$1.crash.txt"
    return 1
  fi
  return 0
}

reset_display() {
  adb shell wm size reset > /dev/null 2>&1 || true
  adb shell wm density reset > /dev/null 2>&1 || true
  adb shell settings put system font_scale 1.0 > /dev/null 2>&1 || true
}

# shellcheck disable=SC2317  # invoked via trap
cleanup() {
  rec_stop
  reset_display
  [[ -n "$LOGCAT_STREAM_PID" ]] && kill "$LOGCAT_STREAM_PID" 2> /dev/null
  return 0
}
trap cleanup EXIT

write_reports() {
  {
    echo "## NutriFlow APK QA pass (emulator)"
    echo
    echo '```'
    cat "$VERSIONS"
    echo '```'
    echo
    echo "| Case | Result | Title | Evidence |"
    echo "|---|---|---|---|"
    while IFS=$'\t' read -r id st title ev; do
      local icon="✅"
      [[ $st == FAIL ]] && icon="❌"
      [[ $st == OBSERVED ]] && icon="👁️"
      printf '| %s | %s %s | %s | %s |\n' "$id" "$icon" "$st" "$title" "${ev//|//}"
    done < "$RESULTS"
  } > "$SUMMARY"
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    cat "$SUMMARY" >> "$GITHUB_STEP_SUMMARY"
  fi
  python3 - "$RESULTS" "$OUT/junit/apk-pass-cases.xml" << 'PY'
import sys
from xml.sax.saxutils import escape, quoteattr
rows = [l.rstrip("\n").split("\t") for l in open(sys.argv[1], encoding="utf-8") if l.strip()]
fails = sum(1 for r in rows if len(r) > 1 and r[1] == "FAIL")
out = ['<?xml version="1.0" encoding="UTF-8"?>',
       f'<testsuites><testsuite name="apk-pass" tests="{len(rows)}" failures="{fails}">']
for r in rows:
    r += [""] * (4 - len(r))
    cid, st, title, ev = r[:4]
    out.append(f'<testcase classname="apk-pass" name={quoteattr(cid + " " + title)}>')
    if st == "FAIL":
        out.append(f'<failure message={quoteattr(ev)}>{escape(ev)}</failure>')
    out.append(f'<system-out>{escape(st + ": " + ev)}</system-out></testcase>')
out.append("</testsuite></testsuites>")
open(sys.argv[2], "w", encoding="utf-8").write("\n".join(out) + "\n")
PY
}

# ---------------------------------------------------------------- setup
log "Device"
adb wait-for-device
adb shell getprop ro.build.version.release | tr -d '\r'
adb shell getprop ro.product.cpu.abi | tr -d '\r'
adb shell wm size; adb shell wm density
adb logcat -v threadtime > "$OUT/logcat/logcat-full-stream.txt" 2>&1 &
LOGCAT_STREAM_PID=$!

log "Install $APK_PATH"
APK_SHA256="$(sha256sum "$APK_PATH" | cut -d' ' -f1)"
adb uninstall "$PKG" > /dev/null 2>&1 || true
INSTALL_OK=1
adb install -r -g "$APK_PATH" 2>&1 | tee "$OUT/logs/adb-install.txt" || true
grep -q '^Success' "$OUT/logs/adb-install.txt" || INSTALL_OK=0

VERSION_LINES="$(adb shell dumpsys package "$PKG" | grep -E 'versionCode|versionName' | tr -d '\r')"
VERSION_CODE="$(grep -o 'versionCode=[0-9]*' <<< "$VERSION_LINES" | head -1 | cut -d= -f2)"
VERSION_NAME="$(grep -o 'versionName=[^ ]*' <<< "$VERSION_LINES" | head -1 | cut -d= -f2)"
{
  echo "package:            $PKG"
  echo "apk_url:            $APK_URL"
  echo "apk_sha256:         $APK_SHA256"
  echo "installed:          versionCode=${VERSION_CODE:-?} versionName=${VERSION_NAME:-?}"
  echo "dumpsys:"
  while IFS= read -r line; do echo "  $line"; done <<< "$VERSION_LINES"
  echo "flows git HEAD:     $(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null)"
  echo "flows maestro/ SHA: $(git -C "$REPO_ROOT" log -1 --format=%H -- maestro/ 2>/dev/null)"
  echo "maestro:            $(maestro --version 2>/dev/null | tail -1)"
  echo "device:             Android $(adb shell getprop ro.build.version.release | tr -d '\r') API $(adb shell getprop ro.build.version.sdk | tr -d '\r') $(adb shell getprop ro.product.cpu.abi | tr -d '\r')"
  echo "run:                ${GITHUB_SERVER_URL:-}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-local}"
} > "$VERSIONS"
log "Versions / SHAs"
cat "$VERSIONS"

if [[ $INSTALL_OK -ne 1 || -z "$VERSION_CODE" ]]; then
  record "setup" FAIL "Install APK" "adb install failed: $(tail -1 "$OUT/logs/adb-install.txt")"
  write_reports
  exit 1
fi
if [[ "$VERSION_CODE" == "$EXPECTED_VERSION_CODE" ]]; then
  record "setup" PASS "Object under test installed" "versionCode=$VERSION_CODE versionName=$VERSION_NAME sha256=${APK_SHA256:0:16}…"
else
  record "setup" FAIL "Object under test installed" "versionCode=$VERSION_CODE (expected $EXPECTED_VERSION_CODE)"
fi

# ---------------------------------------------------------------- a. existing flows
for flow in add-meal-manual meal-persistence-relaunch delete-meal history-tab-deeplink; do
  name="a-$flow"
  case_start "$name"
  if maestro_test "$name" "$FLOWS_QA/$flow.yaml"; then
    st=PASS; ev="flow passed"
  else
    st=FAIL; ev="flow failed: $(maestro_failure "$name")"
  fi
  if [[ $flow == history-tab-deeplink ]]; then
    capture "$name-end"
    ev="$ev; hierarchy: $(sel_state "$name-end")"
  fi
  case_end "$name" || { st=FAIL; ev="$ev; CRASH/ANR in logcat"; }
  record "$name" "$st" "Maestro flow $flow.yaml" "$ev"
done

# ---------------------------------------------------------------- b. deep link killed / background
case_start "b0-guest-setup"
maestro_test "b0-guest-setup" "$FLOWS_CI/guest-setup.yaml" || record "b0-setup" FAIL "Guest session precondition" "$(maestro_failure b0-guest-setup)"
case_end "b0-guest-setup" || true

# b1: app killed
name="b1-deeplink-killed"
case_start "$name"
adb shell am force-stop "$PKG"; sleep 2
log "pid after force-stop: '$(adb shell pidof "$PKG" | tr -d '\r')'"
fire_deeplink "$name"
maestro_test "$name-wait" "$FLOWS_CI/wait-history-screen.yaml"; rc_wait=$?
capture "$name"
if maestro_test "$name-assert" "$FLOWS_CI/assert-history-selected.yaml"; then st=PASS; ev="asserts passed"; else st=FAIL; ev="assert failed: $(maestro_failure "$name-assert")"; fi
[[ $rc_wait -ne 0 ]] && ev="$ev; All Meals screen not reached within 30s"
ev="$ev; screen: $(describe_state "$name")"
case_end "$name" || { st=FAIL; ev="$ev; CRASH/ANR in logcat"; }
record "$name" "$st" "Deep link $DEEPLINK, app killed (cold start)" "$ev"

# b2: app in background
name="b2-deeplink-background"
case_start "$name"
maestro_test "$name-launch" "$FLOWS_CI/ensure-guest-home.yaml"
adb shell input keyevent KEYCODE_HOME; sleep 3
focus_info | tee "$OUT/logs/$name-before-deeplink-focus.txt"
bg_note="app backgrounded"
app_in_foreground && bg_note="WARNING app still in foreground after HOME"
fire_deeplink "$name"
maestro_test "$name-wait" "$FLOWS_CI/wait-history-screen.yaml"; rc_wait=$?
capture "$name"
if maestro_test "$name-assert" "$FLOWS_CI/assert-history-selected.yaml"; then st=PASS; ev="asserts passed"; else st=FAIL; ev="assert failed: $(maestro_failure "$name-assert")"; fi
[[ $rc_wait -ne 0 ]] && ev="$ev; All Meals screen not reached within 30s"
ev="$ev; $bg_note; screen: $(describe_state "$name")"
case_end "$name" || { st=FAIL; ev="$ev; CRASH/ANR in logcat"; }
record "$name" "$st" "Deep link $DEEPLINK, app in background (warm)" "$ev"

# ---------------------------------------------------------------- c. Android back
name="c1-back-normal"
case_start "$name"
maestro_test "$name-launch" "$FLOWS_CI/ensure-guest-home.yaml"
if maestro_test "$name-back" "$FLOWS_CI/back-from-history.yaml"; then st_back=PASS; ev_back="back from History returned to Journal"; else st_back=FAIL; ev_back="$(maestro_failure "$name-back")"; fi
capture "$name-1-after-first-back"
if maestro_test "$name-journal-selected" "$FLOWS_CI/assert-journal-selected.yaml"; then st_sel=PASS; ev_sel="home-tab selected after back"; else st_sel=FAIL; ev_sel="$(maestro_failure "$name-journal-selected")"; fi
ev_sel="$ev_sel; hierarchy: $(sel_state "$name-1-after-first-back")"
log "second back"
adb shell input keyevent KEYCODE_BACK; sleep 4
capture "$name-2-after-second-back"
if app_in_foreground; then st_2=FAIL; ev_2="app still in foreground after 2nd back"; else st_2=PASS; ev_2="app left foreground"; fi
ev_2="$ev_2; $(grep -m1 mCurrentFocus "$OUT/hierarchy/$name-2-after-second-back.focus.txt" | sed 's/^ *//'); $(grep -m1 pidof "$OUT/hierarchy/$name-2-after-second-back.focus.txt")"
if ! case_end "$name"; then st_2=FAIL; ev_2="$ev_2; CRASH/ANR in logcat"; else ev_2="$ev_2; no FATAL/ANR"; fi
record "c1a-back-to-journal" "$st_back" "Back from History -> Journal" "$ev_back; screen: $(describe_state "$name-1-after-first-back")"
record "c1b-journal-selected" "$st_sel" "After back: home-tab selected, History not" "$ev_sel"
record "c1c-second-back" "$st_2" "2nd back -> app to background, no crash" "$ev_2"

# c2: observational — back after a deep-link entry (cold and warm)
for mode in cold warm; do
  name="c2-back-after-deeplink-$mode"
  case_start "$name"
  if [[ $mode == cold ]]; then
    adb shell am force-stop "$PKG"; sleep 2
  else
    maestro_test "$name-launch" "$FLOWS_CI/ensure-guest-home.yaml"
    adb shell input keyevent KEYCODE_HOME; sleep 3
  fi
  fire_deeplink "$name"
  maestro_test "$name-wait" "$FLOWS_CI/wait-history-screen.yaml"
  capture "$name-0-after-deeplink"
  obs="entry: $(describe_state "$name-0-after-deeplink")"
  adb shell input keyevent KEYCODE_BACK; sleep 4
  capture "$name-1-after-first-back"
  obs="$obs; 1st back: $(describe_state "$name-1-after-first-back")"
  if app_in_foreground; then
    adb shell input keyevent KEYCODE_BACK; sleep 4
    capture "$name-2-after-second-back"
    obs="$obs; 2nd back: $(describe_state "$name-2-after-second-back")"
  fi
  st=OBSERVED
  case_end "$name" || { st=FAIL; obs="$obs; CRASH/ANR in logcat"; }
  record "$name" "$st" "Back after deep link entry ($mode) — observational" "$obs"
done

# ---------------------------------------------------------------- d. edit mode across tabs
name="d-edit-mode-preserved"
case_start "$name"
if maestro_test "$name" "$FLOWS_CI/edit-mode-preserved.yaml"; then
  st=PASS; ev="after Inspirer -> Historique: edit mode (Done/Terminer) + selection (delete-selected-btn) still shown"
else
  st=FAIL; ev="flow failed: $(maestro_failure "$name")"
fi
capture "$name-end"
ev="$ev; hierarchy: toggle-edit-mode text=$(awk '$1=="toggle-edit-mode"{if (sub(/.*text=/,"")) print; else print "absent"}' "$OUT/hierarchy/$name-end.summary.txt") delete-selected-btn=$(grep -q '^ *delete-selected-btn *selected' "$OUT/hierarchy/$name-end.summary.txt" && echo present || echo absent)"
case_end "$name" || { st=FAIL; ev="$ev; CRASH/ANR in logcat"; }
record "$name" "$st" "TC-NAV-HIST-04 edit mode kept across tabs" "$ev"

# ---------------------------------------------------------------- e. large font / small screen, FR
for scale in 1.3 2.0; do
  name="e-font-$scale"
  adb shell wm size 720x1280
  adb shell wm density 360
  adb shell settings put system font_scale "$scale"
  {
    adb shell wm size; adb shell wm density
    echo "font_scale=$(adb shell settings get system font_scale | tr -d '\r')"
  } | tr -d '\r' | tee "$OUT/logs/$name-display.txt"
  adb shell am force-stop "$PKG"; sleep 2
  case_start "$name"
  st=PASS; notes=""; shots=0
  if ! maestro_test "$name-launch" "$FLOWS_CI/ensure-guest-home.yaml"; then
    if app_in_foreground; then notes="$notes launch flow failed but app in foreground;"; else st=FAIL; notes="$notes app did not launch/foreground;"; fi
  fi
  maestro_test "$name-lang-fr" "$FLOWS_CI/set-language-fr.yaml" || notes="$notes set FR flow failed ($(maestro_failure "$name-lang-fr"));"
  for pair in home-tab:1-journal all-meals-tab:2-historique add-meals-tab:3-add community-tab:4-community profile-tab:5-me; do
    id="${pair%%:*}"; label="${pair#*:}"
    maestro_test "$name-tap-$label" "$FLOWS_CI/tap-id.yaml" -e "TAP_ID=$id" || notes="$notes tap $id failed;"
    screenshot "e-fs$scale-$label"
    [[ -s "$OUT/screenshots/e-fs$scale-$label.png" ]] && shots=$((shots + 1))
    if ! app_in_foreground; then st=FAIL; notes="$notes app left foreground at $label;"; fi
  done
  maestro_test "$name-chip" "$FLOWS_CI/show-journal-chip.yaml" || notes="$notes journal-history-btn not scrolled into view;"
  capture "e-fs$scale-6-journal-history-chip"
  shots=$((shots + 1))
  chip="$(awk '$1=="journal-history-btn"' "$OUT/hierarchy/e-fs$scale-6-journal-history-chip.summary.txt" | sed 's/^ *//;s/  */ /g')"
  case_end "$name" || { st=FAIL; notes="$notes CRASH/ANR in logcat;"; }
  record "$name" "$st" "Large font $scale, 720x1280 @360dpi (~320dp), FR — evidence screenshots" "$shots screenshots; chip: ${chip:-not found};${notes}"
  reset_display
done

# ---------------------------------------------------------------- wrap-up
reset_display
adb logcat -d -v threadtime > "$OUT/logcat/logcat-final-dump.txt" 2>&1
write_reports
log "Summary"
cat "$SUMMARY"

if awk -F'\t' '$2=="FAIL"{f=1} END{exit !f}' "$RESULTS"; then
  log "At least one case FAILED"
  exit 1
fi
log "All cases passed (observational cases recorded)"
exit 0
