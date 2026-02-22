# QR Protocol, Vault Transfer, and Layout Spec Design

**Date:** 2026-02-22
**Scope:** iOS app (n-of-m) primary, web app (n-of-m-web) secondary via shared specs
**Version:** Both apps align to semver 0.3.0

---

## 1. QR Protocol: URI Scheme

### Format

All QR codes produced by n-of-m use a `nofm://` URI scheme prefix:

```
nofm://share/v2/{base64url-encoded-json}
nofm://vault/v1/{base64url-encoded-encrypted-payload}
```

- `share` -- Shamir secret share (one of N pieces)
- `vault` -- encrypted vault transfer (full secret for device-to-device transfer)
- Version segment (`v2`, `v1`) allows future format changes without breaking parsers
- Payload is base64url-encoded (URL-safe, no padding) to avoid JSON escaping issues in QR

### Scanner Routing

```
scan(data) ->
  if starts with "nofm://share/"  -> parseShare(data)
  if starts with "nofm://vault/"  -> parseVaultTransfer(data)
  else                            -> legacyJsonParse(data)  // backward compat v1
```

Legacy fallback: if data is valid JSON with `v: 1` and `shareData` field, treat as v1 SharePayload. This keeps existing printed cards functional.

### Protocol Versions

| Type | Current | New |
|------|---------|-----|
| Share | v1 (raw JSON, no prefix) | v2 (nofm://share/v2/...) |
| Vault Transfer | N/A | v1 (nofm://vault/v1/...) |

v2 shares have identical fields to v1. The version bump signals URI encoding.

---

## 2. Vault Transfer

### Purpose

Transfer a vault entry between devices via QR code. The QR is PIN-encrypted so a screenshot or photo is safe to transmit over insecure channels.

### VaultTransferPayload

```typescript
interface VaultTransferPayload {
  v: 1;
  name: string;
  mnemonic: string;        // AES-GCM ciphertext (hex: nonce + ciphertext)
  derivationPath: string;
  pathType: PathType;      // 'metamask' | 'ledger' | 'custom'
  wordCount: WordCount;    // 12 | 15 | 18 | 21 | 24
  addressCount: number;
  hasPassphrase: boolean;
  salt: string;            // random 16-byte hex, generated at export time
}
```

Payload size estimate: ~350-650 bytes after encryption (12-word to 24-word mnemonic), well within QR capacity at error correction H.

### Encryption

- User enters a 4-6 digit transfer PIN
- Salt: 16 random bytes (hex), generated fresh each export
- Key derivation: `deriveKey(pin, salt)` -- PBKDF2-SHA256, 10,000 iterations, 256-bit key
- Encryption: `encrypt(mnemonic, key)` -- AES-256-GCM, 12-byte random nonce
- Output: hex string (24-char nonce + ciphertext)

Uses existing `lib/crypto/kdf.ts` and `lib/crypto/aes.ts` unchanged.

### Export Flow (Sender)

1. Vault detail screen -> "Transfer" button (new action, distinct from "Export Data")
2. Modal: enter 4-6 digit transfer PIN, confirm PIN
3. Generate random salt
4. Derive key from PIN + salt
5. Encrypt mnemonic
6. Build VaultTransferPayload, JSON.stringify, base64url encode
7. Wrap: `nofm://vault/v1/{encoded}`
8. Render QR code with "n/m" center badge
9. Show QR with instructions: "Scan this QR from another device. You will need the PIN to restore."

### Import Flow (Receiver)

1. Scanner detects `nofm://vault/v1/` prefix
2. Base64url-decode, JSON.parse -> VaultTransferPayload
3. Navigate to vault import PIN screen
4. User enters transfer PIN
5. Derive key from PIN + payload.salt
6. Decrypt mnemonic
7. Validate: BIP39 checksum pass?
8. On success: derive addresses, save to vault, navigate to vault detail
9. On failure: "Invalid PIN" with retry option

---

## 3. QR Center Logo

### Concept

QR codes display a centered badge overlay for visual identification and branding.

### Implementation

**iOS (react-native-qrcode-svg):**
- Use the `logo` prop with an SVG image
- Logo size: ~15% of QR width (e.g., 42px on a 280px QR)
- White circle background with 2px black border
- Black monospace text centered inside

**PDF/Web (QRious canvas):**
- Render QR to canvas
- Overlay a centered div/SVG using CSS absolute positioning
- Same visual: white circle, black border, black text

### Badge Content

| QR Type | Center Text | Example |
|---------|-------------|---------|
| Shamir share | Actual threshold fraction | "2/3" |
| Vault transfer | Generic brand | "n/m" |
| Address QR (small) | None | (too small for overlay) |

### Error Correction

Bump all share and vault QR codes from error correction 'M' to 'H' (30% recovery capacity) to compensate for the ~7-9% center area occluded by the logo.

---

## 4. SharePayload v2

Identical to v1 but encoded in the new URI format:

```typescript
interface SharePayload {
  v: 2;                    // bumped from 1
  id: string;
  name: string;
  shareIndex: number;
  totalShares: number;
  threshold: number;
  shareData: string;
  derivationPath: string;
  pathType: PathType;
  wordCount: WordCount;
  metadata?: Record<string, string>;
  hasPIN: boolean;
  hasPassphrase: boolean;
}
```

Generation: `"nofm://share/v2/" + base64url(JSON.stringify(payload))`

---

## 5. Card Layout Specification

Canonical values for both iOS and web. Where values currently differ, the spec picks one target.

### Common Properties

- Font family: `Courier New, monospace`
- Page margins: 10mm (CSS `@page { margin: 10mm }`)
- Card border: 3px solid black
- Card shadow: 4px offset black (print-safe, no blur)
- Box sizing: `border-box`
- Section dividers: 2px solid black
- QR frame: 2px solid black, 4px internal padding
- QR error correction: 'H' (for logo support)
- Line height: 1.4-1.5

### Layout Variants

| Property | Full Page | Compact (2-up) | Wallet Size |
|----------|-----------|----------------|-------------|
| Cards per page | 1 | 2 | 4 |
| Card width | 100% | 100% | 100% |
| Card height | 100% | 48% | 23% |
| QR code size | 280px | 160px | 100px |
| Address QR size | 56px | 56px | none |
| Base font size | 11px | 9px | 7px |
| Orientation | portrait | portrait | portrait |
| Notes section | visible (4 lines, 18px each) | hidden | hidden |
| Instructions | 4 paragraphs | 4 paragraphs | 2 paragraphs (first 2 only) |
| Address count | 10 | 5 | 3 |
| Page breaks | after each card | after every 2 cards | none (continuous) |

### Card Anatomy (top to bottom)

**Header:**
- Background: highlight color (configurable per secret)
- Height: auto (padding 6-8px 10-16px)
- Left: share index/total (e.g., "1/5 SHAMIR"), bold, uppercase, letter-spacing 1px
- Right: meta info (e.g., "T:3 - 24W - V2"), bold, uppercase
- Border bottom: 3px solid black
- Font size: base + 1px

**Instructions:**
- Label: "INSTRUCTIONS", 7px, bold, uppercase
- Content: 4 paragraphs (or 2 in wallet size)
- Font size: base - 2.5px (e.g., 8.5px for full page)
- Line height: 1.4-1.5

**Created Date:**
- Label: "CREATED"
- Value: ISO format "YYYY-MM-DD HH:MM"
- Font: monospace, base - 1px, bold
- Layout: flex row
- Border bottom: 2px solid black

**Notes (full page only):**
- Label: "NOTES"
- 4 blank ruled lines, 18px line height, 1px #CCC dividers

**Bottom Section (flex row):**

Left column -- Share QR:
- QR code at layout-specific size
- 2px black frame, 4px padding
- Center badge overlay (threshold text or "n/m")

Right column -- Info:
- "Share QR" info box (8px, what the QR contains)
- "Handle with Care" warning box (8px)
- Primary address row (if available):
  - 56x56px address QR (error correction 'L', no logo)
  - "PRIMARY ADDRESS" label, 7px bold uppercase
  - Truncated address (first 10 + "..." + last 8), 8px monospace

**Footer:**
- Background: #f5f5f5
- Border top: 3px solid black
- Padding: 6-8px 10-16px
- Line 1: Warning ("DO NOT LOSE THIS CARD -- SHARE X OF Y. NEED Z+ TO RECOVER."), 7-8px bold uppercase
- Line 2: "PIN: ENABLED/NONE - PASSPHRASE: ENABLED/NONE", 7-8px bold uppercase, color #666
- Line 3: Share ID (UUID), 7px monospace, color #666, right-aligned

---

## 6. iOS Implementation Notes

### Files to Create

- `lib/qr/protocol.ts` -- URI encode/decode, routing logic, base64url helpers
- `lib/qr/transfer.ts` -- vault transfer encrypt/decrypt, payload builder
- `lib/qr/logo.ts` -- SVG generation for center badge
- `app/(tabs)/vault/transfer.tsx` -- export screen (PIN entry + QR display)
- `app/(tabs)/scan/import.tsx` -- import PIN screen for vault transfers

### Files to Modify

- `constants/types.ts` -- add VaultTransferPayload, bump SharePayload to v2
- `hooks/useScanner.ts` -- add URI prefix detection, route vault transfers
- `components/QRCodeView.tsx` -- add logo prop, error correction H
- `app/(tabs)/vault/[id].tsx` -- add "Transfer" button
- `app/(tabs)/generate/metadata.tsx` -- generate v2 shares with URI prefix
- `lib/pdf/templates.ts` -- center badge overlay in HTML/canvas QR codes
- `package.json` -- version 0.3.0

### Backward Compatibility

- Scanner accepts both `nofm://` prefixed and raw JSON QR data
- v1 shares (raw JSON) continue to work through legacy fallback path
- No changes needed to existing printed cards

---

## 7. Spec Documents for Web Project

Two markdown files will be produced after iOS implementation:

1. **`docs/export-import.md`** -- QR protocol spec (URI format, payload structures, encryption details, scanner routing pseudocode)
2. **`docs/card-layouts.md`** -- canonical layout spec (dimensions, fonts, spacing, content rules per variant)

These are the contract the web project implements against.
