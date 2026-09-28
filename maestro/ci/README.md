# maestro/ci — Android emulator APK QA pass (CI helpers)

Used by `.github/workflows/android-e2e.yml` (GitHub Actions, `reactivecircus/android-emulator-runner`,
API 34 x86_64 google_apis). The workflow downloads a prebuilt EAS preview APK (object under test,
never rebuilt) and runs `bash maestro/ci/run-apk-pass.sh` inside the emulator step.

| File | Role |
|---|---|
| `run-apk-pass.sh` | Installs the APK, prints versionCode/versionName + flows SHA + APK sha256, runs cases a–e, collects JUnit, screenshots, hierarchy dumps, logcat, screen recordings into `$OUT_DIR`, writes `summary.md` / `$GITHUB_STEP_SUMMARY`, exits non-zero if any case failed |
| `hier-summary.py` | Summarises a `maestro hierarchy` dump (tab `selected` states, screen markers) |
| `flows/*.yaml` | Small Maestro helpers/oracles (guest setup, deep link `selected` asserts, back, edit mode TC-NAV-HIST-04, FR language, taps) |

Cases: a) `maestro/flows/{add-meal-manual,meal-persistence-relaunch,delete-meal,history-tab-deeplink}.yaml`;
b) deep link `macrozone://meals` app killed / in background (TC-NAV-HIST-02); c) Android back (TC-NAV-HIST-03)
+ observational back after deep link; d) edit mode kept across tabs (TC-NAV-HIST-04);
e) font_scale 1.3 / 2.0 at 720x1280 @ 360 dpi (~320 dp), FR — evidence screenshots (TC-NAV-HIST-07).

Expected results come from `docs/qa/MacroZone - Strategie et Plan de Test.md` §7.5 — do not relax them here.

Local run (device/emulator connected, Maestro installed):

```bash
APK_PATH=/path/app.apk OUT_DIR=/tmp/apk-pass bash maestro/ci/run-apk-pass.sh
```

## Notes

- Maestro text selectors are **full-match** regexes. The welcome title is one `Text`
  ("Welcome to nutriFlow" / "Bienvenue sur nutriFlow"), so `"Bienvenue|Welcome|nutriFlow"` does
  not match the welcome screen (it only matches the Journal header `nutriFlow`, or the launcher
  icon label). The helpers therefore wait for `id: welcome-guest-btn` / app-rendered texts.
- Case a runs `ensure-guest-home.yaml` before each original flow (harness precondition: an
  existing guest session). The original flows are not modified; those starting with
  `launchApp: clearState: true` still hit their own welcome wait.
- The runner's default AVD is 320x640 @ 160 dpi (320x640 dp): with the soft keyboard up the
  Add Meal form shows only the name field, so `tapOn: meal-calories-input` cannot find the
  field. `wm size` overrides are clamped to 3x the physical height (1920 px there), so the
  workflow creates a `pixel_6` AVD (1080x2400 @ 420), and `run-apk-pass.sh` pins that base
  display (`BASE_WM_SIZE=1080x2400`, `BASE_WM_DENSITY=420`) for cases a–d; case e still
  uses 720x1280 @ 360.
