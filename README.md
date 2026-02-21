# n-of-m

### Shamir -- Ethereum Seed Phrase Manager

> **n-of-m** refers to the core concept of [Shamir's Secret Sharing](https://en.wikipedia.org/wiki/Shamir%27s_secret_sharing):
> a secret is split into **m** total shares, and any **n** of them are sufficient to
> reconstruct it. For example, a **3-of-5** scheme means five cards are printed, and
> any three can recover the original seed phrase. Fewer than three reveal nothing.
> The name is the app's identity -- every screen, every card, every flow revolves
> around this threshold.

Generate BIP39 seed phrases, split them into Shamir secret shares, and export
printable QR code cards for geographically distributed cold storage. Built with
React Native and Expo. **Runs entirely offline -- no servers, no network calls,
no telemetry, ever.**

---

## Walkthrough

<p align="center">
  <img src="docs/images/walkthrough-preview.gif" alt="App walkthrough (first 20s)" width="280" />
</p>

<details>
<summary>Full walkthrough video</summary>

Download the full walkthrough: [`walkthrough.mp4`](docs/images/walkthrough.mp4) (3 MB)

</details>

---

## Screenshots

<table>
  <tr>
    <td align="center"><img src="docs/images/screenshots/homepage.png" alt="Home" width="200" /><br /><strong>Home</strong></td>
    <td align="center"><img src="docs/images/screenshots/generation.png" alt="Generate" width="200" /><br /><strong>Generate</strong></td>
    <td align="center"><img src="docs/images/screenshots/scan.png" alt="Scan" width="200" /><br /><strong>Scan</strong></td>
    <td align="center"><img src="docs/images/screenshots/settings.png" alt="Settings" width="200" /><br /><strong>Settings</strong></td>
  </tr>
</table>

---

## Features

### Seed Phrase Generation

- Generate BIP39 mnemonics in 12, 15, 18, 21, or 24 words
- Three entropy sources: **system RNG** (OS cryptographic random), **device motion** (accelerometer at 20 Hz, SHA-256 hashed), or **combined** (XOR of both)
- Import an existing mnemonic with full BIP39 checksum validation
- Derive Ethereum addresses using **MetaMask** (`m/44'/60'/0'/0/i`), **Ledger Live** (`m/44'/60'/i'/0/0`), or **custom** BIP32/BIP44 paths

### Shamir Secret Sharing

- Split a seed phrase into **m** total shares with a threshold of **n**
- Threshold range: 2 to m (minimum 2 shares required)
- Maximum 10 shares per secret
- Arithmetic over GF(256) -- information-theoretic security, not computational
- Fewer than n shares reveal **zero bits** of information about the original secret

### Printable QR Code Cards (v2)

Each share is exported as a full-page PDF card with clearly labelled sections:

| Section | Content |
|---------|---------|
| **Header** | "n OF m SHAMIR SHARE" with total count, threshold, and format version |
| **Instructions** | What the card does. **Bold** for critical info, underline for user-provided data. Does not reveal PIN status, word count, or path -- only hints the user may be asked |
| **App QR** | Placeholder for a downloadable app link (dashed border) |
| **Created** | ISO date stamp |
| **Notes** | Four ruled lines for handwritten annotations (storage location, custodian, etc.) |
| **Share QR** | Full SharePayload (left), recovery instructions (right), primary address QR + truncated address (bottom-right) |
| **Footer** | Expanded "DO NOT LOSE" warning with share count context. GUID right-justified for cross-referencing |

Cards are always one per page. The design intentionally omits sensitive metadata from the printed card -- during recovery, the app prompts for whatever additional information is needed.

### QR Scanning and Recovery

- Camera-based QR scanner with a viewfinder overlay and real-time progress indicator
- Validates each scanned share: checks JSON structure, verifies the secret ID matches, prevents duplicate scans, enforces a 1.5-second cooldown between reads
- Automatically advances to the next step when the threshold is reached
- If the shares were PIN-protected, prompts for the PIN before reconstruction
- Recovered mnemonic is displayed with derived addresses and can be saved to the vault

### Vault

Encrypted on-device storage for seed phrases and derived addresses.

- **Per-secret locking** -- each vault entry can be independently locked or unlocked. A locked secret cannot be edited, cannot derive new addresses, and cannot be deleted. The lock state is toggled via a header icon using Iosevka Nerd Font lock glyphs
- **Editable names** -- tap the secret name to rename it inline
- **Address management** -- view derived addresses, copy to clipboard, reveal/hide private keys, pin favorite addresses (pinned addresses sort to the top)
- **Re-derive** -- generate additional addresses at any time from the stored mnemonic using any supported path type
- **Re-export** -- regenerate and share PDF cards from a vault entry without repeating the generation flow
- **Metadata** -- optional key-value metadata and card notes are preserved
- **Delete** -- requires the secret to be unlocked, confirmed via system alert

---

## Security

### Offline Always

The app makes **zero network requests**. There is no analytics, no crash reporting, no remote configuration, no update check, and no outbound connection of any kind. The `expo-camera` permission is used exclusively for the QR scanner. All cryptographic operations, storage, and PDF generation happen on-device.

This is a deliberate architectural decision: seed phrases and private keys should never exist on a device with an active network connection to a remote service.

### PIN Protection

An optional 4-to-8-digit numeric PIN encrypts the mnemonic **before** it is split into Shamir shares. This means the shares themselves contain encrypted data -- an attacker who obtains enough shares still cannot reconstruct the seed phrase without the PIN.

- PIN is used to derive an AES-256 encryption key via iterated SHA-256 (10,000 rounds with a unique salt per secret)
- The encrypted mnemonic is what gets split, not the plaintext
- During recovery, the app prompts for the PIN after share reconstruction and before revealing the mnemonic
- The PIN is never stored on the share cards or in the QR data

### BIP39 Passphrase

An optional BIP39 passphrase creates an entirely separate wallet derivation tree. Even with the correct mnemonic, entering the wrong passphrase (or no passphrase) produces different addresses. The passphrase is stored as a boolean flag on the shares to prompt the user during recovery.

### FaceID and TouchID

The vault can be gated behind biometric authentication:

- Enable "Require PIN / FaceID" in Settings to protect the vault tab
- On entry, the app attempts FaceID (or TouchID on older devices) via `expo-local-authentication`
- If biometrics fail or are unavailable, falls back to the app PIN
- Enabling this setting triggers an immediate biometric verification to confirm the user's intent
- Biometric state is stored in `expo-secure-store` -- it does not leave the device

### Per-Vault Locking

Individual secrets can be locked independently of the vault gate:

- A locked secret cannot be renamed, cannot derive new addresses, and cannot be deleted
- The lock state is toggled from the detail screen header
- This provides defense-in-depth: even if someone gets past the vault gate (e.g., on a shared device), they cannot modify or destroy a locked secret
- Locking does not affect read access -- the mnemonic and addresses can still be viewed (the vault gate controls that boundary)

### Encrypted Storage

All vault data is persisted through `expo-secure-store`, which uses the iOS Keychain (hardware-backed on devices with Secure Enclave). Data is encrypted at rest and requires device authentication to access.

### Information-Theoretic Security

Shamir's Secret Sharing over GF(256) provides unconditional security -- not just computational security. An attacker with n-1 shares has the same information as an attacker with zero shares. This is a mathematical property of polynomial interpolation, not an assumption about computational hardness.

---

## Getting Started

### Prerequisites

- Node.js 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator or physical device (camera required for QR scanning)

### Install

```bash
git clone https://github.com/tankbottoms/n-of-m.git
cd n-of-m
npm install
```

### Run

```bash
npx expo start
```

Press `i` for iOS Simulator or scan the QR code with Expo Go on a physical device.

### Test

```bash
npm test
```

---

## Project Structure

```
n-of-m/
  app/
    (tabs)/
      index.tsx              Home screen
      generate/              8-screen generation flow
        index.tsx            Landing (New / Import)
        entropy.tsx          Entropy source selection
        mnemonic.tsx         Seed phrase generation
        import.tsx           Import existing mnemonic
        derivation.tsx       HD path + address derivation
        shamir.tsx           M-of-N threshold config
        metadata.tsx         Name, PIN, passphrase, notes
        preview.tsx          Share card preview + PDF gen
        share.tsx            Export / save
      scan/                  QR scan + recovery flow
        index.tsx            Camera scanner
        pin.tsx              PIN / passphrase entry
        result.tsx           Recovered secret display
      vault/                 Encrypted secret storage
        index.tsx            Secret list (auth-gated)
        [id].tsx             Secret detail + per-item lock
      settings/              App configuration
        index.tsx            PIN, defaults, vault access
        theme.tsx            Color + border customization
        layout.tsx           PDF layout preferences
        about.tsx            App info
    how-it-works.tsx         Educational walkthrough
    how-it-works-math.tsx    Shamir math deep-dive
  components/
    neo/                     Neobrutalist design system
      Button.tsx             NeoButton (primary/secondary/danger)
      Card.tsx               NeoCard (titled container)
      Input.tsx              NeoInput (text field)
      Badge.tsx              NeoBadge (status label)
    AddressRow.tsx           Address display + copy + key reveal
    ColorPicker.tsx          Highlight color selector
    EntropyCanvas.tsx        Accelerometer entropy collector
    MnemonicGrid.tsx         Seed phrase word grid
    PathSpinner.tsx          Numeric stepper control
    QRCodeView.tsx           QR code renderer
    ScanProgress.tsx         Scan progress dots
  constants/
    theme.ts                 NEO design tokens + palettes
    types.ts                 TypeScript interfaces
    derivation.ts            HD path templates
  hooks/
    useGenerateFlow.tsx      Generate flow state context
    useScanFlow.tsx          Scan flow state context
    useScanner.ts            QR scanner state machine
    useTheme.tsx             Theme context (highlight, borders)
    useVault.ts              Vault CRUD operations
  lib/
    crypto/                  AES-256 encryption, key derivation
    pdf/                     PDF card generation (v2)
      templates.ts           Card HTML template
      layouts.ts             Layout configurations
      generate.ts            HTML-to-PDF pipeline
    shamir/                  Shamir split/combine (GF(256))
    wallet/                  BIP32/BIP44 HD address derivation
    storage/                 SecureStore vault layer
  docs/
    ux-spec.html             Full UX widget specification
    images/                  Screenshots and walkthrough media
```

---

## User Flows

### Generate and Export

1. Choose "New Secret" or "Import Existing"
2. If new: select entropy source, collect motion data (if selected), generate mnemonic
3. If import: paste words, validate BIP39 checksum
4. Pick derivation path (MetaMask / Ledger / Custom), derive addresses, review
5. Configure Shamir: set threshold (n) and total shares (m)
6. Add metadata: name, optional PIN, optional passphrase, optional card note
7. Preview share cards with QR codes
8. Generate PDF, share via system sheet or save to vault

### Scan and Recover

1. Open scanner, point camera at printed QR cards
2. Each valid scan fills a progress dot; duplicates are rejected
3. When the threshold is met: enter PIN / passphrase if required
4. View recovered mnemonic and derived addresses
5. Save to vault or dismiss

### Vault Management

1. Authenticate (FaceID / PIN if enabled)
2. Browse saved secrets, tap to open
3. View mnemonic, copy addresses, reveal private keys
4. Lock/unlock individual secrets, rename, derive more, re-export PDF, delete

---

## Design System

The app uses a **neobrutalist** visual language:

- **3px** solid black borders (configurable 1--5px in settings)
- **4px** flat black box shadows (no blur, no border radius)
- **Single highlight color** chosen from pastel, bold, or muted palettes
- **Typography**: Space Grotesk (UI text), Space Mono (addresses, keys, data), Iosevka Nerd Font (lock glyphs, status icons)

See [`docs/ux-spec.html`](docs/ux-spec.html) for the full component and screen specification with visual samples.

---

## How Shamir's Secret Sharing Works

Given a secret **S** and parameters **(n, m)**:

1. Construct a random polynomial **f(x)** of degree **n-1** where **f(0) = S**
2. Evaluate **f** at **m** distinct non-zero points to produce **m** shares
3. Any **n** shares can reconstruct **f(0) = S** via Lagrange interpolation
4. Fewer than **n** shares are mathematically equivalent to having zero shares

All arithmetic is performed in GF(256) (the Galois Field of 256 elements) for byte-level operations. Each byte of the secret is split independently, producing shares of the same length as the original.

The in-app "The Mathematics" screen walks through polynomial construction, Lagrange interpolation, finite field arithmetic, and a concrete 2-of-3 example with real numbers.

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `ethers` | ^6.16 | BIP32/BIP44 HD wallet derivation, BIP39 mnemonic generation |
| `@noble/ciphers` | ^2.1 | AES-256-GCM encryption for vault storage |
| `expo-camera` | ~17.0 | QR code scanning via device camera |
| `expo-sensors` | ~15.0 | Accelerometer data for entropy collection |
| `expo-local-authentication` | ~17.0 | FaceID / TouchID biometric authentication |
| `expo-secure-store` | ~15.0 | iOS Keychain-backed encrypted key-value storage |
| `expo-print` | ~15.0 | HTML-to-PDF generation for share cards |
| `expo-sharing` | ~14.0 | System share sheet for PDF distribution |
| `react-native-qrcode-svg` | ^6.3 | QR code rendering in the app UI |
| `uuid` | ^13.0 | Unique identifiers linking shares to the same secret |

---

## License

Private. All rights reserved.
