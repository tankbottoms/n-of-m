# Maestro E2E Test Plan — n-of-m (SHAMIR)

## Overview

End-to-end test suite for the SHAMIR Ethereum Seed Phrase Manager, a React Native/Expo app
that generates BIP39 seed phrases, splits them into Shamir secret shares, and produces
printable QR code cards.

- **Framework**: Maestro 2.1.0
- **Platform**: iOS Simulator (iPhone 17 Pro, iOS 26.2)
- **App Bundle ID**: `com.anonymous.ios-shamir`
- **Total flows**: 7
- **Full suite run time**: ~6 minutes

---

## Prerequisites

### Environment

```bash
# Java (required by Maestro)
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"

# Maestro CLI
export PATH="$HOME/.maestro/bin:$PATH"

# Verify
maestro --version   # 2.1.0
java --version      # 17+
```

### Simulator

```bash
# Boot simulator
xcrun simctl boot "iPhone 17 Pro"

# Verify app installed
xcrun simctl listapps booted | grep ios-shamir
```

### Dev Server

```bash
# Start with test mode enabled (required for flow 04)
cd /path/to/n-of-m
cp .env.test .env    # Contains EXPO_PUBLIC_TEST_MODE=true
npx expo start --ios --clear
```

**Note**: The `.env` file must contain `EXPO_PUBLIC_TEST_MODE=true` for the scan/recover
flow (04) to work. Metro must be restarted with `--clear` after changing env files.

---

## Test Flows

### 01-home.yaml (5s)

**Purpose**: Verify home screen renders with all primary navigation elements.

| Step | Action | Validation |
|------|--------|------------|
| 1 | Launch app (clear state) | App loads |
| 2 | Assert | "SHAMIR" visible |
| 3 | Assert | "Ethereum Seed Phrase Manager" visible |
| 4 | Assert | "New Secret" button visible |
| 5 | Assert | "Scan Shares" button visible |
| 6 | Screenshot | `home-screen` |

**Screenshots**: `home-screen.png`

---

### 02-generate-system.yaml (~1m)

**Purpose**: Full generate flow using system entropy — the primary happy path.

| Step | Screen | Action | Validation |
|------|--------|--------|------------|
| 1 | Home | Tap "New Secret" | Navigate to generate |
| 2 | Generate Menu | Tap "Generate New Phrase" | Navigate to entropy |
| 3 | Entropy | Wait for "Entropy Source" | Screen loaded |
| 4 | Entropy | Tap "Use System Only" | Navigate to mnemonic |
| 5 | Mnemonic | Wait for "Mnemonic" | Screen loaded |
| 6 | Mnemonic | Tap "Generate" | 24-word phrase generated |
| 7 | Mnemonic | Scroll + Tap "Continue" | Navigate to derivation |
| 8 | Derivation | Wait for "Derivation Path" | Screen loaded |
| 9 | Derivation | Tap "Derive Addresses" | Addresses derived |
| 10 | Derivation | Wait for "10 Addresses" | 10 addresses shown |
| 11 | Derivation | Scroll x3 + Tap "Continue to Shamir" | Navigate to shamir |
| 12 | Shamir | Wait for "Shamir Split" | Screen loaded |
| 13 | Shamir | Scroll + Tap "Continue" | Navigate to metadata |
| 14 | Metadata | Wait for "Metadata" | Screen loaded |
| 15 | Metadata | Scroll + Tap "Generate Shares" | Share generation starts |
| 16 | Preview | Wait for "Preview" (30s) | Shares generated |
| 17 | Preview | Scroll x5 + Tap "Generate PDF" | PDF generation |
| 18 | Share | Wait for "Save to Vault" (30s) | PDF ready |
| 19 | Share | Tap "Save to Vault" | Secret saved |

**Screenshots**: `mnemonic-screen`, `derivation-screen`, `shamir-screen`, `metadata-screen`, `preview-screen`, `share-screen`, `saved-to-vault-screen`

---

### 03-generate-import.yaml (~1m)

**Purpose**: Import an existing seed phrase and generate shares.

| Step | Screen | Action | Validation |
|------|--------|--------|------------|
| 1 | Home | Tap "New Secret" | Navigate to generate |
| 2 | Generate Menu | Wait for "Generate New Phrase" | Menu loaded |
| 3 | Generate Menu | Tap "Import Phrase" | Navigate to import |
| 4 | Import | Wait for "Import Phrase" | Auto-populated 24 words |
| 5 | Import | Scroll + Tap "Validate" | Mnemonic validated |
| 6 | Import | Scroll x2 + Tap "Continue" | Navigate to derivation |
| 7-19 | (Same as flow 02) | Derivation through Save | Full generation |

**Screenshots**: `import-validated-screen`, `import-derivation-screen`, `import-preview-screen`, `import-saved-to-vault-screen`

---

### 04-scan-recover.yaml (~1m)

**Purpose**: Scan shares via test mode to reconstruct a secret.

**Requires**: `EXPO_PUBLIC_TEST_MODE=true` in `.env`

| Step | Screen | Action | Validation |
|------|--------|--------|------------|
| 1 | Home | Tap "Scan Shares" | Navigate to scan |
| 2 | Scan Idle | Wait for "Start Scanning" | Idle state visible |
| 3 | Scan Idle | Tap "Start Scanning" | Scanner activated |
| 4 | Scanner | Wait for "TEST MODE" | Test mode active |
| 5 | Scanner | Input share 1 JSON via `test-scan-input` | Share injected |
| 6 | Scanner | Tap `test-scan-submit` | Share processed |
| 7 | Scanner | Wait for "SCANNED 1 OF 2 REQUIRED" | Progress updated |
| 8 | Scanner | Hide keyboard | Clear for next input |
| 9 | Scanner | Input share 2 JSON via `test-scan-input` | Share injected |
| 10 | Scanner | Tap `test-scan-submit` | Threshold met |
| 11 | Result | Wait for "Secret Recovered" (15s) | Auto-navigate to result |

**Test Fixtures**: `.maestro/fixtures/test-shares.json` contains pre-generated share payloads for "E2E Test" secret (threshold=2, total=3, wordCount=12, MetaMask path, no PIN).

**Screenshots**: `scan-share-1`, `scan-recover-result`

---

### 05-vault-operations.yaml (~1m 10s)

**Purpose**: Generate a secret, save to vault, verify vault list and detail views.

| Step | Screen | Action | Validation |
|------|--------|--------|------------|
| 1-19 | (Same as flow 02) | Full generate flow | Secret saved |
| 20 | Share | Tap "Done" | Navigate back |
| 21 | Tab Bar | Tap "Vault" | Navigate to vault |
| 22 | Vault List | Wait for "24 WORDS" | Badge visible |
| 23 | Vault List | Tap "24 WORDS" | Navigate to detail |
| 24 | Vault Detail | Wait for "Seed Phrase" | Detail loaded |

**Screenshots**: `vault-list`, `vault-detail`

---

### 06-settings-theme.yaml (~22s)

**Purpose**: Verify settings screen, theme configuration, and about page.

| Step | Screen | Action | Validation |
|------|--------|--------|------------|
| 1 | Home | Tap "Settings" tab | Navigate to settings |
| 2 | Settings | Wait for "Settings" | Screen loaded |
| 3 | Settings | Tap "12" (word count) | Default changed |
| 4 | Settings | Scroll + Tap `settings-theme-link` | Navigate to theme |
| 5 | Theme | Wait for "Color Palette" | Theme screen loaded |
| 6 | — | Relaunch app (preserve state) | App restarted |
| 7 | Home | Tap "Settings" tab | Navigate to settings |
| 8 | Settings | Scroll + Tap `settings-about-link` | Navigate to about |
| 9 | About | Wait for "SHAMIR" | About screen loaded |

**Screenshots**: `settings-main`, `settings-theme`, `settings-about`

---

### demo-walkthrough.yaml (~1m 30s)

**Purpose**: Complete app walkthrough capturing screenshots at every screen for documentation.

Captures 17 screenshots covering all major screens:

| # | Screenshot | Screen |
|---|-----------|--------|
| 1 | `demo-01-home` | Home screen |
| 2 | `demo-02-generate-menu` | Generate menu |
| 3 | `demo-03-entropy` | Entropy source selection |
| 4 | `demo-04-mnemonic-blank` | Mnemonic (before generation) |
| 5 | `demo-05-mnemonic-words` | Mnemonic (with words) |
| 6 | `demo-06-derivation` | Derivation path config |
| 7 | `demo-07-addresses` | Derived addresses list |
| 8 | `demo-08-shamir-config` | Shamir threshold config |
| 9 | `demo-09-metadata` | Metadata / naming |
| 10 | `demo-10-preview` | Share card preview |
| 11 | `demo-11-share` | PDF share screen |
| 12 | `demo-12-saved` | Save confirmation |
| 13 | `demo-13-vault-list` | Vault list with saved secret |
| 14 | `demo-14-vault-detail` | Vault detail view |
| 15 | `demo-15-settings` | Settings main screen |
| 16 | `demo-16-theme` | Theme configuration |
| 17 | `demo-17-about` | About screen |

---

## Running Tests

### Full Suite

```bash
export PATH="/opt/homebrew/opt/openjdk/bin:$HOME/.maestro/bin:$PATH"

maestro test \
  .maestro/flows/01-home.yaml \
  .maestro/flows/02-generate-system.yaml \
  .maestro/flows/03-generate-import.yaml \
  .maestro/flows/04-scan-recover.yaml \
  .maestro/flows/05-vault-operations.yaml \
  .maestro/flows/06-settings-theme.yaml \
  .maestro/flows/demo-walkthrough.yaml
```

### Without Test Mode (skip scan flow)

```bash
maestro test \
  .maestro/flows/01-home.yaml \
  .maestro/flows/02-generate-system.yaml \
  .maestro/flows/03-generate-import.yaml \
  .maestro/flows/05-vault-operations.yaml \
  .maestro/flows/06-settings-theme.yaml \
  .maestro/flows/demo-walkthrough.yaml
```

### Single Flow

```bash
maestro test .maestro/flows/01-home.yaml
```

### Screenshots Only (demo walkthrough)

```bash
maestro test .maestro/flows/demo-walkthrough.yaml
# Screenshots saved to project root: demo-01-home.png through demo-17-about.png
```

---

## Code Changes Required for Testing

The following changes were made to app components to support Maestro testing:

### components/neo/Card.tsx

Added `accessible={false}` to prevent iOS accessibility grouping that hides child elements from Maestro:

```tsx
<View style={[styles.card, SHADOW, style]} accessible={false}>
  ...
  <View style={styles.body} accessible={false}>{children}</View>
</View>
```

### app/(tabs)/vault/index.tsx

Added `accessible={false}` to vault card Pressable:

```tsx
<Pressable
  key={secret.id}
  accessible={false}
  testID={`vault-card-${secret.id}`}
  accessibilityLabel={secret.name}
  onPress={...}
>
```

### app/(tabs)/settings/index.tsx

Added `testID` and `accessibilityLabel` to settings navigation links:

```tsx
<Pressable testID="settings-theme-link" accessibilityLabel="Theme" ...>
<Pressable testID="settings-layout-link" accessibilityLabel="PDF Layout" ...>
<Pressable testID="settings-about-link" accessibilityLabel="About" ...>
```

### app/(tabs)/index.tsx

Added `testID` and `accessibilityLabel` to "How It Works" link:

```tsx
<Pressable testID="how-it-works-link" accessibilityLabel="How It Works" ...>
```

---

## Maestro Patterns & Best Practices

### Screen Transitions

Always use `extendedWaitUntil` with timeout at screen boundaries to handle React Native
animation/rendering delays:

```yaml
- extendedWaitUntil:
    visible: "Screen Title"
    timeout: 10000
```

### Scrolling

Content below the fold requires explicit scroll commands. Key scrolling points:
- **Mnemonic screen**: 1 scroll to reach "Continue" button (24-word grid pushes it down)
- **Derivation screen**: 3 scrolls to reach "Continue to Shamir" (10 address rows)
- **Preview screen**: 5 scrolls to reach "Generate PDF" (5 share cards)
- **Shamir/Metadata**: 1 scroll each to reach action buttons

### Accessibility Grouping

iOS `Pressable` and `View` components automatically create accessibility groups that
hide child element text from Maestro. Fix with `accessible={false}`.

### Text Transforms

NeoBadge and many labels use `textTransform: 'uppercase'`. Maestro sees the rendered
(uppercase) text, not the source string:
- Source: `"24 words"` → Maestro sees: `"24 WORDS"`
- Source: `"Scan Shares"` → Maestro sees: `"SCAN SHARES"` (but button text works either way)

### App Relaunches

For settings sub-pages, relaunch the app between visits rather than using back navigation:

```yaml
- launchApp:
    clearState: false
- extendedWaitUntil:
    visible: "SHAMIR"
    timeout: 10000
```

### Test Mode

The scan flow uses `EXPO_PUBLIC_TEST_MODE=true` to show a text input instead of the camera.
This env var must be set before Metro starts and requires `--clear` flag on restart.

---

## Feature Coverage Matrix

| Feature | Flow | Status |
|---------|------|--------|
| Home screen render | 01 | Covered |
| Generate (system entropy) | 02 | Covered |
| Generate (import phrase) | 03 | Covered |
| Entropy selection | 02 | Covered |
| Mnemonic generation | 02, 03 | Covered |
| BIP39 validation | 03 | Covered |
| Derivation (MetaMask path) | 02, 03, 05 | Covered |
| Address derivation | 02, 03, 05 | Covered |
| Shamir split config | 02, 03, 05 | Covered |
| Metadata entry | 02, 03, 05 | Covered |
| Share preview | 02, 03, 05 | Covered |
| PDF generation | 02, 03, 05 | Covered |
| Save to vault | 02, 03, 05 | Covered |
| Scan shares (test mode) | 04 | Covered |
| Secret reconstruction | 04 | Covered |
| Vault list display | 05, demo | Covered |
| Vault detail view | 05, demo | Covered |
| Settings defaults | 06 | Covered |
| Theme configuration | 06 | Covered |
| About screen | 06 | Covered |
| Full walkthrough | demo | Covered |

### Not Yet Covered (Manual Testing Required)

| Feature | Reason |
|---------|--------|
| PIN protection | Requires system dialog interaction |
| Biometric auth (FaceID) | Requires hardware/simulator config |
| Vault authentication gate | Requires PIN setup first |
| PDF sharing (system share sheet) | Requires system dialog interaction |
| Camera QR scanning | Requires real camera / no simulator support |
| Motion entropy | Requires accelerometer data |
| Vault secret deletion | Destructive — manual only |
| Vault secret editing | Complex interaction (rename, lock toggle) |
| Custom derivation paths | Requires PathEditor segment editing |
| Ledger derivation path | Variant of MetaMask flow |
| Different word counts (12/15/18/21) | Variant of 24-word flow |
| PDF layout options (2-up, wallet) | Requires layout settings change |
| Multiple vault entries | Requires running generate twice |
| Error states | Invalid input, network errors |

---

## Test Artifacts

### Screenshots Directory

All `takeScreenshot` screenshots are saved to the project root:

```
demo-01-home.png through demo-17-about.png     # Demo walkthrough (17 images)
home-screen.png                                  # Flow 01
mnemonic-screen.png, derivation-screen.png, ...  # Flow 02 (7 images)
import-validated-screen.png, ...                 # Flow 03 (4 images)
scan-share-1.png, scan-recover-result.png        # Flow 04 (2 images)
vault-list.png, vault-detail.png                 # Flow 05 (2 images)
settings-main.png, settings-theme.png, ...       # Flow 06 (3 images)
```

### Maestro Test Reports

HTML reports and JSON command logs saved to `~/.maestro/tests/<timestamp>/`.
