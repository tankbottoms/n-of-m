# Maestro E2E Testing Harness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Maestro-based E2E testing harness that can drive the n-of-m app through all user flows on the iOS Simulator, with a test mode for hardware-dependent features (camera, biometrics).

**Architecture:** Maestro YAML flows running against a native iOS Simulator build. A thin test mode layer activated by `EXPO_PUBLIC_TEST_MODE=true` replaces the camera QR scanner with a text input and auto-approves biometric prompts. All other app logic (crypto, storage, navigation, PDF) runs for real.

**Tech Stack:** Maestro CLI (YAML), Expo SDK 54, React Native 0.81, iOS Simulator (Xcode)

**Design doc:** `docs/plans/2026-02-17-maestro-testing-design.md`

---

### Task 1: Install Maestro and Create Directory Structure

**Files:**
- Create: `.maestro/config.yaml`
- Create: `.maestro/flows/.gitkeep`
- Create: `.maestro/scripts/.gitkeep`
- Modify: `.gitignore`

**Step 1: Install Maestro CLI**

Run: `curl -Ls "https://get.maestro.mobile.dev" | bash`
Expected: Maestro installed to `~/.maestro/bin/maestro`

**Step 2: Verify installation**

Run: `maestro --version`
Expected: Version string printed (e.g. `1.x.x`)

**Step 3: Create directory structure**

Run: `mkdir -p .maestro/flows .maestro/scripts .maestro/screenshots`

**Step 4: Determine the iOS bundle identifier**

The app uses Expo managed workflow with slug `ios-shamir`. We need to prebuild to get the actual bundle ID.

Run: `npx expo prebuild --platform ios --no-install 2>&1 | head -20`

Then check the generated Xcode project:

Run: `grep -r "PRODUCT_BUNDLE_IDENTIFIER" ios/*.xcodeproj/project.pbxproj | head -3`

Store this bundle ID for config.yaml. If prebuild doesn't create one, use `com.tankbottoms.iosshamir` as default.

**Step 5: Create `.maestro/config.yaml`**

```yaml
# Maestro configuration for n-of-m app
# Bundle ID determined from expo prebuild
appId: ${BUNDLE_ID_FROM_STEP_4}
```

**Step 6: Add screenshots directory to .gitignore**

Append to `.gitignore`:
```
# Maestro test output
.maestro/screenshots/
```

**Step 7: Commit**

```bash
git add .maestro/config.yaml .maestro/flows/.gitkeep .maestro/scripts/.gitkeep .gitignore
git commit -m "Add Maestro E2E testing directory structure"
```

---

### Task 2: Create the Test Mode Environment Flag

**Files:**
- Create: `.env.test`
- Modify: `.gitignore`

**Step 1: Create `.env.test`**

```
EXPO_PUBLIC_TEST_MODE=true
```

**Step 2: Add `.env.test` to `.gitignore` (it contains no secrets, but keep it opt-in)**

Actually -- `.env.test` is fine to commit since it contains no secrets and others need it to run test mode. Skip this step.

**Step 3: Commit**

```bash
git add .env.test
git commit -m "Add test mode environment file for Maestro E2E testing"
```

---

### Task 3: Add Test Mode Camera Bypass to Scan Screen

**Files:**
- Modify: `app/(tabs)/scan/index.tsx`

This is the core test mode change. When `EXPO_PUBLIC_TEST_MODE === 'true'`, the scan screen's active scanning state renders a `TextInput` + "Inject Scan" button instead of the `CameraView`. The idle state and all scanner logic remain unchanged.

**Step 1: Add test mode constant at the top of the file**

At the top of `app/(tabs)/scan/index.tsx`, after the imports, add:

```tsx
const TEST_MODE = process.env.EXPO_PUBLIC_TEST_MODE === 'true';
```

**Step 2: Add state for test input data**

Inside `ScanScreen`, after the existing state declarations, add:

```tsx
const [testInput, setTestInput] = useState('');
```

Import `TextInput` from `react-native` (add to the existing import).

**Step 3: Add test scan handler**

After the `handleStartScanning` callback, add:

```tsx
const handleTestScan = useCallback(() => {
  if (testInput.trim()) {
    handleBarCodeScanned({ data: testInput.trim() });
    setTestInput('');
  }
}, [testInput, handleBarCodeScanned]);
```

**Step 4: Replace the camera section in the active scanning return**

In the active scanning JSX (the final `return` block starting around line 131), wrap the camera container and overlay in a conditional:

```tsx
{TEST_MODE ? (
  <View style={styles.testInputContainer}>
    <Text style={styles.testModeLabel}>TEST MODE</Text>
    <TextInput
      testID="test-scan-input"
      style={styles.testInput}
      value={testInput}
      onChangeText={setTestInput}
      placeholder="Paste SharePayload JSON here..."
      placeholderTextColor="#999"
      multiline
      numberOfLines={4}
    />
    <NeoButton
      testID="test-scan-submit"
      title="Inject Scan"
      onPress={handleTestScan}
      style={{ marginTop: 12 }}
    />
  </View>
) : (
  /* existing CameraView + overlay code */
  <View style={styles.cameraContainer}>
    <CameraView ... />
    <View style={styles.overlay} pointerEvents="none">
      ...
    </View>
  </View>
)}
```

**Step 5: Add styles for test mode elements**

Add to the `StyleSheet.create` block:

```tsx
testInputContainer: {
  flex: 1,
  padding: 16,
  justifyContent: 'center',
},
testModeLabel: {
  fontFamily: NEO.fontUIBold,
  fontSize: 12,
  color: '#CC6600',
  textTransform: 'uppercase',
  letterSpacing: 2,
  textAlign: 'center',
  marginBottom: 16,
},
testInput: {
  fontFamily: NEO.fontMono,
  fontSize: 13,
  color: NEO.text,
  borderWidth: NEO.borderWidth,
  borderColor: NEO.border,
  padding: 12,
  minHeight: 120,
  textAlignVertical: 'top',
  backgroundColor: '#FAFAFA',
},
```

**Step 6: Verify the test mode flag is false when unset**

Run: `npx expo start --ios` (without env file)
Expected: Normal camera view appears on scan screen.

Run: `EXPO_PUBLIC_TEST_MODE=true npx expo start --ios`
Expected: Text input appears instead of camera on scan screen.

**Step 7: Commit**

```bash
git add app/(tabs)/scan/index.tsx
git commit -m "Add test mode camera bypass for Maestro E2E testing"
```

---

### Task 4: Add Biometric Bypass for Test Mode

**Files:**
- Modify: `app/(tabs)/settings/index.tsx`

The biometric auth call lives in the settings screen's vault auth toggle (lines 220-237). In test mode, skip the `LocalAuthentication.authenticateAsync()` call.

**Step 1: Add test mode constant**

At the top of `app/(tabs)/settings/index.tsx`, after imports:

```tsx
const TEST_MODE = process.env.EXPO_PUBLIC_TEST_MODE === 'true';
```

**Step 2: Modify the vault auth toggle handler**

In the `Switch` `onValueChange` handler (around line 214), after `if (val) {`, add the test mode bypass:

```tsx
if (val) {
  if (!TEST_MODE) {
    // Verify identity before enabling
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = compatible && await LocalAuthentication.isEnrolledAsync();
    if (enrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity to enable vault protection',
        disableDeviceFallback: false,
      });
      if (!result.success) {
        Alert.alert('Authentication Failed', 'Vault protection was not enabled.');
        return;
      }
    }
  }
  // If test mode or no biometrics, PIN is sufficient
}
```

**Step 3: Commit**

```bash
git add app/(tabs)/settings/index.tsx
git commit -m "Add biometric bypass for test mode in settings vault auth"
```

---

### Task 5: Write Flow 1 -- Home Screen

**Files:**
- Create: `.maestro/flows/01-home.yaml`

**Step 1: Write the flow**

```yaml
appId: ${BUNDLE_ID}
---
- launchApp:
    clearState: true

# Home screen assertions
- assertVisible: "SHAMIR"
- assertVisible: "Ethereum Seed Phrase Manager"
- assertVisible: "New Secret"
- assertVisible: "Scan Shares"
- assertVisible: "How It Works"

# Screenshot
- takeScreenshot: home-screen
```

**Step 2: Build the app for simulator**

Run: `npx expo run:ios --configuration Release`
Expected: App builds and launches in iOS Simulator.

**Step 3: Run the flow**

Run: `maestro test .maestro/flows/01-home.yaml`
Expected: All assertions pass. Screenshot saved.

**Step 4: Commit**

```bash
git add .maestro/flows/01-home.yaml
git commit -m "Add Maestro home screen flow test"
```

---

### Task 6: Write Flow 2 -- Generate with System RNG

**Files:**
- Create: `.maestro/flows/02-generate-system.yaml`

**Step 1: Write the flow**

```yaml
appId: ${BUNDLE_ID}
---
- launchApp:
    clearState: true

# Navigate to Generate
- tapOn: "New Secret"

# Generate screen
- assertVisible: "Generate"
- tapOn: "Generate New Phrase"

# Entropy screen
- assertVisible: "Entropy Source"
- tapOn: "Use System Only"

# Mnemonic screen -- auto-navigated after system RNG selection
# Need to generate first
- assertVisible: "Seed Phrase"
- assertVisible: "Word Count"
- tapOn: "Generate"
- waitForAnimationToEnd

# Assert mnemonic is displayed (the card title includes word count)
- assertVisible: "24-Word Mnemonic"
- takeScreenshot: generate-mnemonic

# Continue to derivation
- tapOn: "Continue"

# Derivation screen
- assertVisible: "Derivation Path"
# Derive addresses with default settings
- tapOn: "Derive Addresses"
- waitForAnimationToEnd
- assertVisible: "Addresses"

# Continue to Shamir
- tapOn: "Continue to Shamir"

# Shamir screen
- assertVisible: "Shamir Split"
- assertVisible: "Threshold (M)"
- assertVisible: "Total Shares (N)"
# Default is 2 of 3 -- just continue
- tapOn: "Continue"

# Metadata screen
- assertVisible: "Metadata"
# Clear the auto-generated name and type our own
- tapOn: "Name"
- clearInput
- inputText: "Test Secret"

# Generate shares (no PIN, no passphrase)
- tapOn: "Generate Shares"
- waitForAnimationToEnd

# Preview screen
- assertVisible: "Preview"
- assertVisible: "1 OF 3"
- takeScreenshot: generate-preview

# Generate PDF
- tapOn: "Generate PDF"
- waitForAnimationToEnd

# Share screen
- assertVisible: "PDF Ready"
- assertVisible: "[DONE]"

# Save to vault
- tapOn: "Save to Vault"
- waitForAnimationToEnd
- assertVisible: "Saved to Vault"

- takeScreenshot: generate-complete
```

**Step 2: Run the flow**

Run: `maestro test .maestro/flows/02-generate-system.yaml`
Expected: Full generate flow completes. Screenshots captured at mnemonic, preview, and completion.

**Step 3: Commit**

```bash
git add .maestro/flows/02-generate-system.yaml
git commit -m "Add Maestro generate flow test (system RNG)"
```

---

### Task 7: Write Flow 3 -- Generate via Import

**Files:**
- Create: `.maestro/flows/03-generate-import.yaml`

The import screen auto-generates a 24-word mnemonic on mount. We'll use that pre-filled phrase, validate it, and continue through the flow.

**Step 1: Write the flow**

```yaml
appId: ${BUNDLE_ID}
---
- launchApp:
    clearState: true

# Navigate to Generate -> Import
- tapOn: "New Secret"
- tapOn: "Import Phrase"

# Import screen -- a 24-word phrase is auto-generated
- assertVisible: "Import Phrase"
- assertVisible: "24 words"

# Validate the pre-filled mnemonic
- tapOn: "Validate"
- waitForAnimationToEnd
- assertVisible: "Valid BIP39 Mnemonic"
- takeScreenshot: import-validated

# Continue
- tapOn: "Continue"

# Derivation screen
- assertVisible: "Derivation Path"
- tapOn: "Derive Addresses"
- waitForAnimationToEnd
- tapOn: "Continue to Shamir"

# Shamir screen -- use defaults
- tapOn: "Continue"

# Metadata screen
- tapOn: "Name"
- clearInput
- inputText: "Imported Secret"
- tapOn: "Generate Shares"
- waitForAnimationToEnd

# Preview
- assertVisible: "Preview"
- tapOn: "Generate PDF"
- waitForAnimationToEnd

# Save
- tapOn: "Save to Vault"
- waitForAnimationToEnd
- assertVisible: "Saved to Vault"

- takeScreenshot: import-complete
```

**Step 2: Run the flow**

Run: `maestro test .maestro/flows/03-generate-import.yaml`
Expected: Import flow completes using the auto-generated mnemonic.

**Step 3: Commit**

```bash
git add .maestro/flows/03-generate-import.yaml
git commit -m "Add Maestro import flow test"
```

---

### Task 8: Write the Test QR Payload Generator Script

**Files:**
- Create: `.maestro/scripts/generate-test-shares.js`

Maestro's `runScript` executes JavaScript. This script generates `SharePayload` JSON strings that can be injected into the test mode scan input. We need to produce valid shares from a known mnemonic.

The challenge: Maestro's `runScript` runs in a minimal JS sandbox. It cannot import node modules or the app's `lib/shamir`. Instead, we'll pre-generate the share payloads and hardcode them.

**Step 1: Write a Node.js helper script that generates test share data**

This runs once locally (not inside Maestro) to produce the fixture data.

```js
// .maestro/scripts/generate-test-shares.js
//
// Run with: node .maestro/scripts/generate-test-shares.js
// Outputs: JSON share payloads to stdout for use in Maestro flows
//
// This uses the app's actual Shamir split code to generate valid test shares.

const path = require('path');

// We need to set up the same environment the app uses
require('../../lib/polyfills');
const { split } = require('../../lib/shamir');
const { Buffer } = require('buffer');

const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
const SECRET_ID = 'test-secret-e2e-001';
const THRESHOLD = 2;
const TOTAL_SHARES = 3;

const secretBuffer = Buffer.from(TEST_MNEMONIC);
const shares = split(secretBuffer, {
  shares: TOTAL_SHARES,
  threshold: THRESHOLD,
});

const payloads = shares.map((shareBuf, i) => ({
  v: 1,
  id: SECRET_ID,
  name: 'E2E Test',
  shareIndex: i + 1,
  totalShares: TOTAL_SHARES,
  threshold: THRESHOLD,
  shareData: shareBuf.toString('hex'),
  derivationPath: "m/44'/60'/0'/0",
  pathType: 'metamask',
  wordCount: 12,
  hasPIN: false,
  hasPassphrase: false,
}));

// Output each share as a single line of JSON
payloads.forEach((p, i) => {
  console.log(`SHARE_${i + 1}=${JSON.stringify(p)}`);
});

console.log('\n--- For Maestro YAML (copy these) ---\n');
payloads.forEach((p, i) => {
  console.log(`# Share ${i + 1}:`);
  console.log(JSON.stringify(p));
  console.log('');
});
```

**Step 2: Run the script to generate test fixtures**

Run: `node .maestro/scripts/generate-test-shares.js`

If this fails due to module resolution (the app uses ESM/TypeScript), we need an alternative approach: run the shares through Jest.

**Step 3: Alternative -- generate shares via existing test infrastructure**

Create a simple test file that outputs share payloads:

```bash
cd /Users/mark.phillips/Developer/n-of-m
npx jest --testPathPattern="shamir" --verbose 2>&1 | head -20
```

If the module approach doesn't work cleanly, hardcode the share payloads by running the generation once and saving the output to a fixture file.

**Step 4: Create the fixture file with pre-generated share payloads**

Create: `.maestro/fixtures/test-shares.json`

```json
{
  "mnemonic": "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
  "threshold": 2,
  "totalShares": 3,
  "shares": [
    "SHARE_1_JSON_FROM_STEP_2",
    "SHARE_2_JSON_FROM_STEP_2",
    "SHARE_3_JSON_FROM_STEP_2"
  ]
}
```

The actual share hex data must be generated from the running app. One approach: add a `console.log` temporarily in the generate flow, run through it manually with the test mnemonic, and capture the payloads from the Metro console.

**Step 5: Commit**

```bash
mkdir -p .maestro/fixtures
git add .maestro/scripts/generate-test-shares.js .maestro/fixtures/
git commit -m "Add test share payload generator for scan flow E2E tests"
```

---

### Task 9: Write Flow 4 -- Scan and Recover (Test Mode)

**Files:**
- Create: `.maestro/flows/04-scan-recover.yaml`

This flow requires: (1) test mode enabled, (2) pre-generated share payloads in the fixture file from Task 8.

Maestro's `runScript` can read from `output` to pass data between steps. We'll use `runScript` to load the fixture and set share JSONs as output variables.

**Step 1: Write the flow**

```yaml
appId: ${BUNDLE_ID}
tags:
  - test-mode
---
- launchApp:
    clearState: true

# Load test share data via runScript
- runScript:
    file: scripts/load-shares.js
    env:
      FIXTURE_PATH: fixtures/test-shares.json

# Navigate to Scan tab
- tapOn: "Scan"
- assertVisible: "Scan Shares"
- tapOn: "Start Scanning"

# In test mode, we see the text input instead of camera
- assertVisible: "TEST MODE"

# Inject share 1
- tapOn:
    id: "test-scan-input"
- inputText: "${output.share1}"
- tapOn:
    id: "test-scan-submit"

# Assert share 1 scanned
- assertVisible: "Share #1 scanned"

# Inject share 2 (threshold is 2, so this completes recovery)
- tapOn:
    id: "test-scan-input"
- inputText: "${output.share2}"
- tapOn:
    id: "test-scan-submit"

# Should auto-navigate to result screen (no PIN required)
- waitForAnimationToEnd
- assertVisible: "abandon"
- takeScreenshot: scan-recovered
```

Note: The exact flow depends on Maestro's `runScript` capabilities with file reading. If `runScript` can't read files from the flow directory, we'll inline the share JSONs directly in the YAML (less clean but works).

**Step 2: Write the helper script**

Create: `.maestro/scripts/load-shares.js`

```js
// Loads pre-generated share payloads for the scan test
// Output variables are accessible in the flow as ${output.share1}, etc.
const shares = JSON.parse(FIXTURE_PATH_CONTENT);
output.share1 = shares.shares[0];
output.share2 = shares.shares[1];
output.share3 = shares.shares[2];
output.mnemonic = shares.mnemonic;
```

If Maestro's `runScript` sandbox is too limited, fall back to inlining the JSON payloads directly in the YAML as `inputText` values.

**Step 3: Run the flow (requires test mode build)**

Run:
```bash
EXPO_PUBLIC_TEST_MODE=true npx expo run:ios
maestro test .maestro/flows/04-scan-recover.yaml
```
Expected: Shares injected, mnemonic recovered, screenshot captured.

**Step 4: Commit**

```bash
git add .maestro/flows/04-scan-recover.yaml .maestro/scripts/load-shares.js
git commit -m "Add Maestro scan and recover flow test (test mode)"
```

---

### Task 10: Write Flow 5 -- Vault Operations

**Files:**
- Create: `.maestro/flows/05-vault-operations.yaml`

This flow creates a secret first (reusing the generate steps), then exercises vault CRUD.

**Step 1: Write the flow**

```yaml
appId: ${BUNDLE_ID}
---
- launchApp:
    clearState: true

# First, create a secret to populate the vault
# (abbreviated generate flow)
- tapOn: "New Secret"
- tapOn: "Generate New Phrase"
- tapOn: "Use System Only"
- tapOn: "Generate"
- waitForAnimationToEnd
- tapOn: "Continue"
- tapOn: "Derive Addresses"
- waitForAnimationToEnd
- tapOn: "Continue to Shamir"
- tapOn: "Continue"
- tapOn: "Name"
- clearInput
- inputText: "Vault Test"
- tapOn: "Generate Shares"
- waitForAnimationToEnd
- tapOn: "Generate PDF"
- waitForAnimationToEnd
- tapOn: "Save to Vault"
- waitForAnimationToEnd
- tapOn: "Done"

# Navigate to Vault tab
- tapOn: "Vault"
- waitForAnimationToEnd

# Assert secret appears in list
- assertVisible: "Vault Test"
- assertVisible: "24 words"
- assertVisible: "2 of 3 shares"
- takeScreenshot: vault-list

# Tap into detail view
- tapOn: "Vault Test"
- waitForAnimationToEnd
- takeScreenshot: vault-detail

# Scroll down to see more content
- scrollDown

# Test rename (if there's a rename button -- check vault detail screen)
# Test lock/unlock
# Test delete

- takeScreenshot: vault-detail-scrolled
```

Note: The exact vault detail interactions depend on the `[id].tsx` screen's UI, which has inline rename, lock/unlock toggles, and delete button. The flow will be refined after verifying the actual element text/labels.

**Step 2: Run the flow**

Run: `maestro test .maestro/flows/05-vault-operations.yaml`
Expected: Secret created, vault populated, detail view navigated.

**Step 3: Commit**

```bash
git add .maestro/flows/05-vault-operations.yaml
git commit -m "Add Maestro vault operations flow test"
```

---

### Task 11: Write Flow 6 -- Settings and Theme

**Files:**
- Create: `.maestro/flows/06-settings-theme.yaml`

**Step 1: Write the flow**

```yaml
appId: ${BUNDLE_ID}
---
- launchApp:
    clearState: true

# Navigate to Settings tab
- tapOn: "Settings"

# Assert default state
- assertVisible: "PIN Protection"
- assertVisible: "No PIN"
- assertVisible: "Default Values"
- assertVisible: "Word Count"
- takeScreenshot: settings-main

# Change word count to 12
- tapOn: "12"

# Navigate to Theme
- tapOn: "Theme"
- waitForAnimationToEnd
- assertVisible: "Theme"
- takeScreenshot: settings-theme

# Go back to settings
- back

# Navigate to About
- tapOn: "About"
- waitForAnimationToEnd
- takeScreenshot: settings-about

# Go back
- back
```

**Step 2: Run the flow**

Run: `maestro test .maestro/flows/06-settings-theme.yaml`
Expected: Settings screens navigated, screenshots captured.

**Step 3: Commit**

```bash
git add .maestro/flows/06-settings-theme.yaml
git commit -m "Add Maestro settings and theme flow test"
```

---

### Task 12: Write Demo Walkthrough Flow

**Files:**
- Create: `.maestro/flows/demo-walkthrough.yaml`

Composite flow with screenshots at every transition. Meant for generating a visual walkthrough of the app.

**Step 1: Write the flow**

```yaml
appId: ${BUNDLE_ID}
---
- launchApp:
    clearState: true

# Home
- takeScreenshot: demo-01-home
- assertVisible: "SHAMIR"

# Generate
- tapOn: "New Secret"
- takeScreenshot: demo-02-generate-menu

- tapOn: "Generate New Phrase"
- takeScreenshot: demo-03-entropy

- tapOn: "Use System Only"
- takeScreenshot: demo-04-mnemonic-blank

- tapOn: "Generate"
- waitForAnimationToEnd
- takeScreenshot: demo-05-mnemonic-generated

- tapOn: "Continue"
- takeScreenshot: demo-06-derivation

- tapOn: "Derive Addresses"
- waitForAnimationToEnd
- takeScreenshot: demo-07-addresses

- tapOn: "Continue to Shamir"
- takeScreenshot: demo-08-shamir

- tapOn: "Continue"
- takeScreenshot: demo-09-metadata

- tapOn: "Name"
- clearInput
- inputText: "Demo Wallet"
- tapOn: "Generate Shares"
- waitForAnimationToEnd
- takeScreenshot: demo-10-preview

- tapOn: "Generate PDF"
- waitForAnimationToEnd
- takeScreenshot: demo-11-share

- tapOn: "Save to Vault"
- waitForAnimationToEnd
- takeScreenshot: demo-12-saved

- tapOn: "Done"

# Vault
- tapOn: "Vault"
- waitForAnimationToEnd
- takeScreenshot: demo-13-vault-list

- tapOn: "Demo Wallet"
- waitForAnimationToEnd
- takeScreenshot: demo-14-vault-detail

- back

# Settings
- tapOn: "Settings"
- takeScreenshot: demo-15-settings

- tapOn: "Theme"
- waitForAnimationToEnd
- takeScreenshot: demo-16-theme

- back

- tapOn: "About"
- waitForAnimationToEnd
- takeScreenshot: demo-17-about
```

**Step 2: Run the flow**

Run: `maestro test .maestro/flows/demo-walkthrough.yaml`
Expected: 17 screenshots captured in `.maestro/screenshots/`.

**Step 3: Commit**

```bash
git add .maestro/flows/demo-walkthrough.yaml
git commit -m "Add Maestro demo walkthrough flow with full screenshot capture"
```

---

### Task 13: Add npm Scripts for Running Tests

**Files:**
- Modify: `package.json`

**Step 1: Add Maestro test scripts to package.json**

Add to the `"scripts"` section:

```json
"test:e2e": "maestro test .maestro/flows/",
"test:e2e:home": "maestro test .maestro/flows/01-home.yaml",
"test:e2e:generate": "maestro test .maestro/flows/02-generate-system.yaml",
"test:e2e:import": "maestro test .maestro/flows/03-generate-import.yaml",
"test:e2e:scan": "maestro test .maestro/flows/04-scan-recover.yaml",
"test:e2e:vault": "maestro test .maestro/flows/05-vault-operations.yaml",
"test:e2e:settings": "maestro test .maestro/flows/06-settings-theme.yaml",
"test:e2e:demo": "maestro test .maestro/flows/demo-walkthrough.yaml"
```

**Step 2: Commit**

```bash
git add package.json
git commit -m "Add npm scripts for Maestro E2E test flows"
```

---

### Task 14: Build, Run Full Suite, and Fix Issues

This is the integration task. Build the app, run all flows, and fix any targeting/timing issues.

**Step 1: Build the app for iOS Simulator**

Run: `npx expo run:ios`
Expected: App builds and launches in simulator.

**Step 2: Run all non-test-mode flows**

Run: `maestro test .maestro/flows/01-home.yaml .maestro/flows/02-generate-system.yaml .maestro/flows/03-generate-import.yaml .maestro/flows/05-vault-operations.yaml .maestro/flows/06-settings-theme.yaml`

Expected: All flows pass. If any fail, diagnose with `maestro studio` to inspect elements.

**Step 3: Run test-mode flows**

Kill the app, rebuild with test mode:

Run: `EXPO_PUBLIC_TEST_MODE=true npx expo run:ios`

Then:

Run: `maestro test .maestro/flows/04-scan-recover.yaml`

Expected: Scan flow passes with injected shares.

**Step 4: Run demo walkthrough**

Run: `maestro test .maestro/flows/demo-walkthrough.yaml`

Expected: 17 screenshots captured.

**Step 5: Fix any issues found**

Common issues:
- Element not found: Use `maestro studio` to inspect the element tree, adjust selectors
- Timing: Add `waitForAnimationToEnd` or explicit `extendedWaitUntil`
- Scroll needed: Add `scrollDown` before asserting off-screen elements
- Text case: Maestro text matching is case-sensitive; match the rendered text exactly (buttons render uppercase via CSS but the React text is title-case)

**Step 6: Commit fixes**

```bash
git add -A
git commit -m "Fix Maestro flow targeting and timing issues from integration testing"
```

---

### Task 15: Add testID Attributes (Separate Pass)

**Files:**
- Modify: `components/neo/Button.tsx`
- Modify: `components/neo/Card.tsx`
- Modify: `components/neo/Input.tsx`
- Modify: various screen files as needed

Per the user's instruction: implement this after the Maestro flows are working. This makes targeting more reliable than text matching.

**Step 1: Add testID passthrough to NeoButton**

In `components/neo/Button.tsx`, the component already spreads `...props` which includes `testID` from `PressableProps`. No change needed -- `testID` already works.

Verify by checking the `NeoButtonProps` interface extends `Omit<PressableProps, 'style'>` which includes `testID`.

**Step 2: Add testID to NeoCard**

In `components/neo/Card.tsx`, add `testID?: string` to `NeoCardProps` and pass it to the outer `View`:

```tsx
interface NeoCardProps {
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
  showHeader?: boolean;
  testID?: string;
}

export function NeoCard({ title, children, style, showHeader = true, testID }: NeoCardProps) {
  // ...
  return (
    <View testID={testID} style={[styles.card, SHADOW, style]}>
```

**Step 3: Add testID to NeoInput**

In `components/neo/Input.tsx`, the component already spreads `...props` onto `TextInput`, which includes `testID`. No change needed.

**Step 4: Add testID attributes to key screen elements**

Add `testID` to the most frequently targeted elements in each screen. Focus on elements that are ambiguous when matched by text:

- Stepper +/- buttons in `shamir.tsx`: `testID="threshold-dec"`, `testID="threshold-inc"`, `testID="shares-dec"`, `testID="shares-inc"`
- Name input in `metadata.tsx`: Already targetable via the label "Name"
- Vault list items: `testID={`vault-item-${secret.id}`}` on each `Pressable`

**Step 5: Update Maestro flows to use testID selectors where helpful**

Replace fragile text selectors with `id:` selectors:

```yaml
# Before
- tapOn: "+"

# After
- tapOn:
    id: "threshold-inc"
```

**Step 6: Commit**

```bash
git add components/neo/ app/
git commit -m "Add testID attributes to neo components and key screen elements"
```

---

## Execution Notes

**Prerequisites before starting:**
- Xcode installed with iOS Simulator
- `npx expo run:ios` must work (may need `npx expo prebuild` first)
- Maestro CLI installed

**Task dependencies:**
- Tasks 1-4 are foundational (directory, env, test mode)
- Tasks 5-7 and 11-12 (flows) can be written in parallel after Tasks 1-4
- Task 8-9 (scan flow) depends on Tasks 3-4 (test mode)
- Task 10 (vault) can be written independently
- Task 14 (integration) depends on all prior tasks
- Task 15 (testIDs) is independent, done last per user instruction
