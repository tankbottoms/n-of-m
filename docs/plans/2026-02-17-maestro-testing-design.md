# Maestro E2E Testing Harness Design

**Date**: 2026-02-17
**Status**: Approved
**Goal**: Automated regression testing, QA, and scripted demo walkthroughs for the n-of-m Expo app

## Architecture

**Maestro** (YAML-based mobile UI testing framework) running against an iOS Simulator build. Two layers:

1. **Maestro flows** (`.maestro/flows/*.yaml`) -- external YAML files that drive the app, assert state, and capture screenshots. No app code changes needed for most flows.
2. **Test mode** (`EXPO_PUBLIC_TEST_MODE=true`) -- a thin conditional layer inside the app that bypasses hardware-dependent features (camera, FaceID) with injectable alternatives.

### Directory Structure

```
.maestro/
  config.yaml              # App ID, device config
  flows/
    01-home.yaml
    02-generate-system.yaml
    03-generate-import.yaml
    04-scan-recover.yaml
    05-vault-operations.yaml
    06-settings-theme.yaml
    demo-walkthrough.yaml
  scripts/
    generate-test-qr.js    # Generate SharePayload JSON for scan tests
  screenshots/              # Output directory (gitignored)
```

## Test Mode

Activated by `EXPO_PUBLIC_TEST_MODE=true` environment variable.

### Camera Bypass (Scan Screen)

When test mode is active, the scan screen renders a `TextInput` + "Inject Scan" button instead of `CameraView`. Maestro types a `SharePayload` JSON string into the input and taps the button, which calls the same `scanner.onScan(data)` handler the camera uses. The real camera code path is untouched.

### Biometric Bypass

When test mode is active, `useVault.ts` skips `LocalAuthentication.authenticateAsync()` and returns success immediately.

### What Remains Real

- Generate flow (System RNG, mnemonic generation, derivation)
- Vault storage (SecureStore/Keychain works in simulator)
- PDF generation (expo-print works in simulator)
- All navigation, state management, and crypto logic
- Theme system and settings persistence

## testID Attributes

Add `testID` props to key interactive elements for reliable Maestro targeting:

- `NeoButton`: Pass `testID` through to `Pressable`
- Screen headings, input fields, stepper buttons, mnemonic grid
- Vault list items, address rows, lock/unlock controls

This is additive -- no behavior changes. Implemented as a separate pass.

## Test Flows

### Flow 1: Home Screen (`01-home.yaml`)
- Launch app
- Assert "SHAMIR" title, "New Secret" button, "Scan Shares" button, "How It Works" card
- Screenshot

### Flow 2: Generate with System RNG (`02-generate-system.yaml`)
- Home -> "New Secret" -> "Generate New Phrase"
- Select "Use System Only" entropy
- Assert 24-word mnemonic displayed
- Continue through derivation (MetaMask default), Shamir (2 of 3), metadata (name: "Test Secret", no PIN)
- Preview screen: assert QR card, screenshot
- Save to vault

### Flow 3: Generate via Import (`03-generate-import.yaml`)
- Home -> "New Secret" -> "Import Phrase"
- Paste known valid 12-word test mnemonic
- Continue through full flow, save to vault

### Flow 4: Scan + Recover (`04-scan-recover.yaml`)
- **Requires test mode**
- `runScript` generates 3 SharePayload JSONs from test mnemonic
- Navigate to Scan -> "Start Scanning"
- Inject share 1, assert "Share #1 scanned"
- Inject share 2, assert progress
- Threshold met -> auto-navigate to result
- Assert recovered mnemonic matches original

### Flow 5: Vault Operations (`05-vault-operations.yaml`)
- Creates its own secret first (or depends on prior flow)
- Navigate to Vault, assert secret in list
- Detail view: assert mnemonic hidden, toggle reveal, copy address
- Rename, lock, unlock, delete, assert empty

### Flow 6: Settings + Theme (`06-settings-theme.yaml`)
- Navigate to Settings
- Assert defaults (24 words, MetaMask, 10 addresses)
- Change word count to 12
- Theme screen: select Bold palette, screenshot
- About screen: assert version string

### Flow 7: Demo Walkthrough (`demo-walkthrough.yaml`)
- Composite: generate -> vault -> settings
- Screenshots at every screen transition
- Output: timestamped gallery in `.maestro/screenshots/`

## Running

```bash
# Install Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Build for simulator
npx expo run:ios

# Run all flows
maestro test .maestro/flows/

# Run single flow
maestro test .maestro/flows/02-generate-system.yaml

# Run with test mode (for scan flow)
EXPO_PUBLIC_TEST_MODE=true npx expo run:ios
maestro test .maestro/flows/04-scan-recover.yaml

# Demo with screenshots
maestro test .maestro/flows/demo-walkthrough.yaml
```

## Dependencies

- **Maestro CLI**: Installed via curl, no npm dependency
- **Xcode + iOS Simulator**: Required for `expo run:ios`
- **No new npm packages**: Test mode uses only existing RN primitives (`TextInput`, conditional rendering)

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Maestro element targeting breaks on text changes | Use `testID` attributes as primary selectors |
| Scan test requires app rebuild with test mode | Use `.env.test` file, document the workflow |
| Flows become flaky due to animation timing | Maestro handles waits automatically; add explicit `waitForAnimationToEnd` if needed |
| Test mnemonic leaks into production | Test mode gated behind env var, never set in production builds |
