# Shamir - Ethereum Seed Phrase & Shamir Secret Sharing App

**Date:** 2026-02-15
**Platform:** iOS (Expo + TypeScript)
**Status:** Design Approved

---

## 1. Overview

Shamir is an iOS app for generating, managing, and securely backing up Ethereum wallet seed phrases using Shamir's Secret Sharing (SSS). The app splits seed phrases into M-of-N QR code shares, generates printable neobrutalist PDF cards, and reconstructs secrets by scanning any M shares with the device camera.

### Core Value Proposition

- Generate BIP39 seed phrases with configurable entropy sources
- Derive Ethereum addresses with Metamask/Ledger/custom derivation paths
- Split secrets into Shamir shares encoded as QR codes
- Generate password-protected PDFs with neobrutalist-styled offline cards
- Reconstruct secrets by scanning the threshold number of QR shares
- Store secrets encrypted on-device with PIN protection

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Expo SDK 52+ (managed → dev build) | Camera, filesystem, sharing APIs built-in |
| Language | TypeScript (strict) | Type safety for crypto operations |
| Navigation | expo-router (file-based) | Standard Expo navigation |
| Wallet/Crypto | ethers.js v6 | BIP39, BIP32, HD wallets, address derivation |
| SSS | shamirs-secret-sharing-ts (ported) | User's own library, pure TS, GF(2^8) |
| QR Scanning | expo-camera (CameraView + barcode) | Built-in barcode scanning |
| QR Generation | react-native-qrcode-svg | SVG-based QR rendering |
| PDF Generation | react-native-html-to-pdf | HTML/CSS → PDF via native iOS renderer |
| Sharing | expo-sharing | iOS share sheet integration |
| Storage | expo-secure-store + expo-file-system | Keychain for keys, filesystem for encrypted data |
| Entropy | expo-camera + react-native-gesture-handler | Photo randomness + finger-draw canvas |
| Styling | Custom neobrutalism system (no external UI lib) | Black/white + user-selected highlight color |

### Crypto Polyfills Required

- `react-native-get-random-values` — CSPRNG for React Native
- `@ethersproject/shims` or `expo-crypto` — crypto API compatibility
- `buffer` — Buffer polyfill for ethers.js

---

## 3. Navigation Structure

```
Tab Navigator (5 tabs, bottom bar, neobrutalist styled)
├── Home        — Landing page with instructions and quick actions
├── Generate    — Create seed phrase → configure → split → PDF
├── Scan        — Camera QR reader → reconstruct secret
├── Vault       — Saved secrets with address viewer
└── Settings    — PIN, defaults, PDF layout, color theme
```

### Screen Inventory

**Home Tab:**
- `HomeScreen` — Instructions, feature overview, quick-action cards

**Generate Tab:**
- `EntropyScreen` — Choose entropy method (system / finger-draw / camera / combined)
- `GenerateScreen` — Configure and generate seed phrase (word count, type)
- `DerivationScreen` — Choose path type, view addresses, reveal private keys
- `ShamirConfigScreen` — Set M-of-N threshold
- `MetadataScreen` — Add label, metadata, PIN/passphrase for shares
- `PDFPreviewScreen` — Preview cards, choose layout, generate PDF
- `ShareScreen` — iOS share sheet for PDF

**Scan Tab:**
- `ScanScreen` — Camera with QR scanning, progress tracker
- `PINEntryScreen` — Enter PIN/passphrase if share requires it
- `ReconstructedScreen` — Display recovered mnemonic + addresses

**Vault Tab:**
- `VaultListScreen` — List of saved secrets
- `VaultDetailScreen` — View secret details, addresses, export options

**Settings Tab:**
- `SettingsScreen` — PIN setup, default word count, default address count, derivation path default
- `ThemeScreen` — Color picker with presets
- `PDFLayoutScreen` — Card layout options (1-up, 2-up, wallet-size, full-page)
- `AboutScreen` — Version, help, instructions

---

## 4. Data Model

### SecretRecord (on-device storage)

```typescript
interface SecretRecord {
  id: string;                              // UUID v4
  name: string;                            // user-defined label
  createdAt: number;                       // Unix timestamp
  mnemonic: string;                        // encrypted seed phrase (AES-256-GCM)
  wordCount: 12 | 15 | 18 | 21 | 24;     // BIP39 word count
  derivationPath: string;                  // full path e.g. "m/44'/60'/0'/0"
  pathType: 'metamask' | 'ledger' | 'custom';
  addressCount: number;                    // number of derived addresses stored
  addresses: DerivedAddress[];             // encrypted
  shamirConfig: {
    threshold: number;                     // M required to reconstruct
    totalShares: number;                   // N total shares
  };
  metadata?: Record<string, string>;       // user-defined key-value pairs
  hasPassphrase: boolean;                  // BIP39 25th-word passphrase used
  hasPIN: boolean;                         // PIN protects the shares
}

interface DerivedAddress {
  index: number;                           // derivation index
  address: string;                         // 0x... Ethereum address
  privateKey: string;                      // encrypted, revealed on demand
}
```

### SharePayload (QR code content)

```typescript
interface SharePayload {
  v: 1;                                    // format version
  id: string;                              // links shares to same secret
  name: string;                            // secret label
  shareIndex: number;                      // which share (1..N)
  totalShares: number;                     // N
  threshold: number;                       // M
  shareData: string;                       // hex-encoded SSS share
  derivationPath: string;                  // so reconstruction knows the path
  pathType: 'metamask' | 'ledger' | 'custom';
  wordCount: 12 | 15 | 18 | 21 | 24;
  metadata?: Record<string, string>;
  hasPIN: boolean;                         // prompt user for PIN on scan
  hasPassphrase: boolean;                  // prompt user for passphrase on scan
}
```

QR payload is JSON-stringified. If PIN is set, the `shareData` field contains the SSS share of the **encrypted** mnemonic (encrypted with PIN-derived key before splitting).

### Encryption Architecture

```
PIN → PBKDF2(100k iterations, random salt) → AES-256-GCM key
  ├── Encrypts mnemonic before SSS split (if PIN enabled on shares)
  └── Encrypts SecretRecord fields at rest on device

Device master key → stored in expo-secure-store (iOS Keychain)
  └── Encrypts/decrypts the vault file in expo-file-system
```

---

## 5. Core Flows

### 5.1 Generate Flow

```
[Choose Entropy] → [Generate Mnemonic] → [Configure Derivation]
       ↓                    ↓                      ↓
  finger-draw +      12/15/18/21/24         Metamask / Ledger /
  camera snapshot     BIP39 words            Custom path
  + system CSPRNG                                  ↓
                                          [View 10 Addresses]
                                          [Reveal Private Keys]
                                                   ↓
                                          [Shamir Config: M of N]
                                                   ↓
                                          [Add Metadata / PIN / Passphrase]
                                                   ↓
                                          [Generate PDF Cards]
                                                   ↓
                                          [Share Sheet → Print / Save]
                                                   ↓
                                          [Save to Vault (optional)]
```

**Entropy mixing:**
1. Collect raw entropy from selected sources (touch coords + timing, camera pixel hash)
2. Hash all sources together with SHA-256
3. XOR result with system CSPRNG output (crypto.getRandomValues)
4. Use combined entropy to generate BIP39 mnemonic via ethers.js

### 5.2 Scan/Reconstruct Flow

```
[Open Camera] → [Scan QR #1] → [Scan QR #2] → ... → [Scan QR #M]
                     ↓               ↓                      ↓
              Parse SharePayload  Validate same ID     Threshold met!
              Show progress UI    Check consistency          ↓
                                                    [Enter PIN if required]
                                                    [Enter Passphrase if required]
                                                           ↓
                                                    [SSS Combine → Mnemonic]
                                                           ↓
                                                    [Derive Addresses]
                                                    [Display Results]
                                                    [Save to Vault option]
```

### 5.3 PDF Generation Flow

1. User configures layout (1-up, 2-up, wallet-size, full-page)
2. For each share (1..N):
   - Encode SharePayload as JSON string
   - Generate QR code SVG
   - Render neobrutalist card as HTML with QR image
3. Combine all cards into single HTML document with page breaks
4. Convert HTML → PDF via react-native-html-to-pdf
5. If password-protected: encrypt PDF (via native iOS PDF encryption API or JS-based)
6. Present share sheet

---

## 6. Neobrutalist Design System

### Base Theme

| Token | Value |
|-------|-------|
| `--bg` | `#FFFFFF` |
| `--text` | `#000000` |
| `--border` | `#000000` |
| `--border-width` | `3px` |
| `--shadow-offset` | `4px` |
| `--shadow-color` | `#000000` |
| `--radius` | `0px` |
| `--highlight` | User-selected (default: pastel blue `#A8D8EA`) |
| `--font-ui` | Space Grotesk |
| `--font-mono` | Space Mono |

### Color Picker

Rainbow gradient picker with preset palettes:

**Pastels (default):** `#A8D8EA` (blue), `#F4B8C1` (pink), `#B8E6C8` (green), `#F9E8A0` (yellow), `#C8B8E6` (purple), `#F4C9A8` (orange)

**Bold:** `#0066FF`, `#FF0066`, `#00FF66`, `#FFFF00`

**Muted:** `#C4A4A4`, `#A4C4A4`, `#7A8A9A`, `#C4A464`

### Component Patterns

**Button (Primary):**
```
Background: highlight color
Border: 3px solid black
Shadow: 4px 4px 0 black
On press: translate(2px, 2px), shadow(2px, 2px)
Text: black, bold, uppercase
```

**Button (Secondary):**
```
Background: white
Border: 3px solid black
Shadow: 4px 4px 0 black
Text: black
```

**Card:**
```
Background: white
Border: 3px solid black
Shadow: 6px 6px 0 black
Padding: 16px
Header stripe: highlight color, full-width
```

**Input:**
```
Background: white
Border: 3px solid black
Font: monospace (for crypto inputs)
Focus: highlight color border
Padding: 12px
```

**Tab Bar:**
```
Background: white
Border-top: 3px solid black
Active tab: highlight color background
Icons: bold, black outlines
```

### PDF Card Design

```
┌─────────────────────────────────────────┐
│ ██ SHAMIR SHARE 2/5 ████████████████████│  ← highlight color header
├─────────────────────────────────────────┤
│                                         │
│   ┌─────────────┐   Name: My ETH Wallet│
│   │             │   Threshold: 3 of 5   │
│   │   QR CODE   │   Created: 2026-02-15 │
│   │             │   Path: Metamask      │
│   │             │   Words: 24           │
│   └─────────────┘   PIN: Required       │
│                                         │
│─────────────────────────────────────────│
│ shamir v1 | share 2 of 5 | DO NOT LOSE │
└─────────────────────────────────────────┘
```

- 3px black border, 6px solid shadow
- Highlight color header bar
- QR code with generous quiet zone
- Metadata right-aligned beside QR
- Footer with version and warning

### Layout Options

- **Full page:** 1 card per page, large QR code
- **2-up:** 2 cards per page, landscape-oriented
- **Wallet-size:** Credit card dimensions, 4 per page
- **Custom:** User-defined dimensions in settings

---

## 7. Derivation Paths

| Type | Path | Used By |
|------|------|---------|
| Metamask | `m/44'/60'/0'/0/{index}` | MetaMask, most web wallets |
| Ledger | `m/44'/60'/{index}'/0/0` | Ledger Live |
| Custom | User-defined string | Advanced users |

Default: Metamask. Configurable in Settings.

---

## 8. Security Considerations

- **No network requests.** The app operates entirely offline after installation. No analytics, no telemetry, no cloud sync.
- **Memory handling.** Mnemonics and private keys are cleared from memory after use (zeroed buffers where possible).
- **PIN brute-force protection.** PBKDF2 with 100k iterations. Consider adding lockout after N failed attempts.
- **QR data size.** A 24-word mnemonic SSS share + metadata in JSON should fit within QR version 15-20 (~500-700 bytes). Monitor payload size.
- **PDF password protection.** iOS native PDF encryption (128-bit AES) via the print renderer. Fallback: warn user to store PDFs securely.
- **No clipboard for sensitive data.** Private keys and mnemonics are displayed but never auto-copied. User must long-press to copy with a warning.

---

## 9. Project Structure

```
ios-shamir/
├── app/                          # expo-router file-based routes
│   ├── (tabs)/                   # tab layout
│   │   ├── _layout.tsx           # tab navigator config
│   │   ├── index.tsx             # Home tab
│   │   ├── generate/             # Generate tab screens
│   │   │   ├── index.tsx         # entropy selection
│   │   │   ├── mnemonic.tsx      # generate & display
│   │   │   ├── derivation.tsx    # path config & addresses
│   │   │   ├── shamir.tsx        # M-of-N config
│   │   │   ├── metadata.tsx      # label, PIN, passphrase
│   │   │   ├── preview.tsx       # PDF card preview
│   │   │   └── share.tsx         # share sheet
│   │   ├── scan/                 # Scan tab screens
│   │   │   ├── index.tsx         # camera scanner
│   │   │   ├── pin.tsx           # PIN/passphrase entry
│   │   │   └── result.tsx        # reconstructed secret
│   │   ├── vault/                # Vault tab screens
│   │   │   ├── index.tsx         # secret list
│   │   │   └── [id].tsx          # secret detail
│   │   └── settings/             # Settings tab screens
│   │       ├── index.tsx         # main settings
│   │       ├── theme.tsx         # color picker
│   │       ├── layout.tsx        # PDF layout config
│   │       └── about.tsx         # help & version
│   └── _layout.tsx               # root layout
├── components/                   # shared UI components
│   ├── neo/                      # neobrutalist primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Badge.tsx
│   │   └── TabBar.tsx
│   ├── ColorPicker.tsx           # rainbow picker + presets
│   ├── EntropyCanvas.tsx         # finger-draw entropy
│   ├── QRCodeView.tsx            # QR code renderer
│   ├── AddressRow.tsx            # address with copy/reveal
│   ├── ScanProgress.tsx          # "2 of 3 scanned" UI
│   └── MnemonicGrid.tsx          # word grid display
├── lib/                          # core logic (no UI)
│   ├── shamir/                   # ported from shamirs-secret-sharing-ts
│   │   ├── split.ts
│   │   ├── combine.ts
│   │   ├── lagrange.ts
│   │   ├── horner.ts
│   │   ├── codec.ts
│   │   ├── table.ts
│   │   ├── random.ts
│   │   └── constants.ts
│   ├── wallet/                   # ethers.js wrappers
│   │   ├── generate.ts           # mnemonic generation
│   │   ├── derive.ts             # HD derivation
│   │   └── paths.ts              # path constants
│   ├── entropy/                  # entropy collection & mixing
│   │   ├── canvas.ts             # touch coordinate hashing
│   │   ├── camera.ts             # photo pixel hashing
│   │   └── mix.ts                # combine sources with CSPRNG
│   ├── pdf/                      # PDF card generation
│   │   ├── templates.ts          # HTML templates for cards
│   │   ├── generate.ts           # HTML → PDF pipeline
│   │   └── layouts.ts            # layout dimension configs
│   ├── crypto/                   # encryption utilities
│   │   ├── aes.ts                # AES-256-GCM encrypt/decrypt
│   │   └── kdf.ts                # PBKDF2 key derivation
│   └── storage/                  # secure storage wrapper
│       ├── vault.ts              # CRUD for SecretRecords
│       └── keys.ts               # SecureStore key management
├── hooks/                        # React hooks
│   ├── useTheme.ts               # color theme context
│   ├── useVault.ts               # vault operations
│   └── useScanner.ts             # QR scan state machine
├── constants/                    # app constants
│   ├── theme.ts                  # color palettes, design tokens
│   └── derivation.ts             # path presets
├── app.json                      # Expo config
├── package.json
├── tsconfig.json
└── babel.config.js
```

---

## 10. Dependencies

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-camera": "~16.0.0",
    "expo-crypto": "~14.0.0",
    "expo-file-system": "~18.0.0",
    "expo-font": "~13.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-sharing": "~13.0.0",
    "ethers": "^6.13.0",
    "react-native-html-to-pdf": "^0.12.0",
    "react-native-qrcode-svg": "^6.3.0",
    "react-native-svg": "^15.0.0",
    "react-native-get-random-values": "^1.11.0",
    "buffer": "^6.0.3",
    "uuid": "^10.0.0"
  }
}
```

---

## 11. Expo Go vs Dev Build

| Feature | Expo Go | Dev Build Required |
|---------|---------|-------------------|
| UI/Navigation | Yes | - |
| ethers.js + crypto | Yes (with polyfills) | - |
| Shamir SSS | Yes | - |
| expo-camera (QR scan) | Yes | - |
| QR code generation | Yes | - |
| expo-secure-store | Yes | - |
| react-native-html-to-pdf | No | Yes |
| Custom native modules | No | Yes |

**Strategy:** Develop UI, wallet logic, SSS, and scanning with Expo Go. Switch to EAS dev build when integrating PDF generation. Use `expo-print` as a fallback for Expo Go testing (generates PDF from HTML via WebView).

---

## 12. Out of Scope (v1)

- Cloud backup / sync
- Multi-chain support (ETH only)
- WalletConnect / dApp browser
- Android support (iOS first)
- Biometric unlock (future: FaceID/TouchID)
- Share distribution via NFC or AirDrop
