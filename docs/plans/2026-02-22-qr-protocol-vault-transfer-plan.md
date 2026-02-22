# QR Protocol + Vault Transfer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `nofm://` URI scheme to all QR codes, build PIN-encrypted vault transfer (export/import), add center logo badges to QR codes, and produce cross-platform spec docs.

**Architecture:** New `lib/qr/` module handles URI encoding/decoding/routing. Vault transfer uses existing `lib/crypto/` for AES-GCM encryption with PIN-derived keys. Scanner gets a routing layer that detects URI prefix vs legacy JSON. QRCodeView gains logo overlay support.

**Tech Stack:** React Native, expo-camera, react-native-qrcode-svg (logo prop), expo-crypto, QRious (PDF), existing AES-GCM + KDF from lib/crypto/

---

### Task 1: QR Protocol Module -- URI Encode/Decode

**Files:**
- Create: `lib/qr/protocol.ts`
- Create: `lib/qr/__tests__/protocol.test.ts`

**Step 1: Write the failing tests**

```typescript
// lib/qr/__tests__/protocol.test.ts
import { encodeShareURI, encodeVaultURI, parseQR, QRType } from '../protocol';

describe('QR Protocol', () => {
  const sampleShare = {
    v: 2 as const, id: 'abc-123', name: 'Test', shareIndex: 1,
    totalShares: 3, threshold: 2, shareData: 'deadbeef',
    derivationPath: "m/44'/60'/0'/0", pathType: 'metamask' as const,
    wordCount: 12 as const, hasPIN: false, hasPassphrase: false,
  };

  test('encodeShareURI produces nofm://share/v2/ prefix', () => {
    const uri = encodeShareURI(sampleShare);
    expect(uri).toMatch(/^nofm:\/\/share\/v2\//);
  });

  test('encodeShareURI roundtrips through parseQR', () => {
    const uri = encodeShareURI(sampleShare);
    const result = parseQR(uri);
    expect(result.type).toBe('share');
    if (result.type === 'share') {
      expect(result.payload.id).toBe('abc-123');
      expect(result.payload.v).toBe(2);
    }
  });

  test('encodeVaultURI produces nofm://vault/v1/ prefix', () => {
    const uri = encodeVaultURI('encrypted-blob', 'abcdef1234');
    expect(uri).toMatch(/^nofm:\/\/vault\/v1\//);
  });

  test('encodeVaultURI roundtrips through parseQR', () => {
    const uri = encodeVaultURI('encrypted-blob', 'salt123');
    const result = parseQR(uri);
    expect(result.type).toBe('vault');
    if (result.type === 'vault') {
      expect(result.payload.mnemonic).toBe('encrypted-blob');
      expect(result.payload.salt).toBe('salt123');
    }
  });

  test('parseQR handles legacy JSON (v1 share)', () => {
    const legacy = JSON.stringify({ v: 1, shareData: 'abc', id: 'x' });
    const result = parseQR(legacy);
    expect(result.type).toBe('legacy_share');
  });

  test('parseQR returns unknown for garbage input', () => {
    const result = parseQR('not a qr code');
    expect(result.type).toBe('unknown');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest lib/qr/__tests__/protocol.test.ts --no-coverage`
Expected: FAIL -- module not found

**Step 3: Write the implementation**

```typescript
// lib/qr/protocol.ts
import { SharePayload, VaultTransferPayload, PathType, WordCount } from '../../constants/types';

export type QRType = 'share' | 'vault' | 'legacy_share' | 'unknown';

export interface ParsedShare { type: 'share'; payload: SharePayload }
export interface ParsedVault { type: 'vault'; payload: VaultTransferPayload }
export interface ParsedLegacy { type: 'legacy_share'; payload: SharePayload }
export interface ParsedUnknown { type: 'unknown' }

export type ParseResult = ParsedShare | ParsedVault | ParsedLegacy | ParsedUnknown;

const SHARE_PREFIX = 'nofm://share/v2/';
const VAULT_PREFIX = 'nofm://vault/v1/';

function toBase64Url(str: string): string {
  // TextEncoder works in React Native with hermes
  const bytes = new TextEncoder().encode(str);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(b64: string): string {
  const padded = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeShareURI(share: SharePayload): string {
  return SHARE_PREFIX + toBase64Url(JSON.stringify(share));
}

export function encodeVaultURI(encryptedMnemonic: string, salt: string, opts?: {
  name?: string; derivationPath?: string; pathType?: PathType;
  wordCount?: WordCount; addressCount?: number; hasPassphrase?: boolean;
}): string {
  const payload: VaultTransferPayload = {
    v: 1,
    name: opts?.name ?? 'Transferred Secret',
    mnemonic: encryptedMnemonic,
    derivationPath: opts?.derivationPath ?? "m/44'/60'/0'/0",
    pathType: opts?.pathType ?? 'metamask',
    wordCount: opts?.wordCount ?? 12,
    addressCount: opts?.addressCount ?? 10,
    hasPassphrase: opts?.hasPassphrase ?? false,
    salt,
  };
  return VAULT_PREFIX + toBase64Url(JSON.stringify(payload));
}

export function parseQR(data: string): ParseResult {
  // New protocol: nofm:// URI scheme
  if (data.startsWith(SHARE_PREFIX)) {
    try {
      const json = fromBase64Url(data.slice(SHARE_PREFIX.length));
      const payload = JSON.parse(json) as SharePayload;
      return { type: 'share', payload };
    } catch { return { type: 'unknown' }; }
  }

  if (data.startsWith(VAULT_PREFIX)) {
    try {
      const json = fromBase64Url(data.slice(VAULT_PREFIX.length));
      const payload = JSON.parse(json) as VaultTransferPayload;
      return { type: 'vault', payload };
    } catch { return { type: 'unknown' }; }
  }

  // Legacy: raw JSON with v:1 and shareData
  try {
    const parsed = JSON.parse(data);
    if (parsed.v === 1 && parsed.shareData) {
      return { type: 'legacy_share', payload: parsed as SharePayload };
    }
  } catch { /* not JSON */ }

  return { type: 'unknown' };
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest lib/qr/__tests__/protocol.test.ts --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/qr/protocol.ts lib/qr/__tests__/protocol.test.ts
git commit -m "feat: add nofm:// QR protocol URI encode/decode module"
```

---

### Task 2: VaultTransferPayload Type + Version Bump

**Files:**
- Modify: `constants/types.ts` (add VaultTransferPayload, bump SharePayload v)
- Modify: `package.json:3` (version 0.3.0)

**Step 1: Add VaultTransferPayload to types**

In `constants/types.ts`, after the `SharePayload` interface (line 64), add:

```typescript
export interface VaultTransferPayload {
  v: 1;
  name: string;
  mnemonic: string;
  derivationPath: string;
  pathType: PathType;
  wordCount: WordCount;
  addressCount: number;
  hasPassphrase: boolean;
  salt: string;
}
```

**Step 2: Bump package.json version**

In `package.json`, change `"version": "1.0.0"` to `"version": "0.3.0"`.

**Step 3: Commit**

```bash
git add constants/types.ts package.json
git commit -m "feat: add VaultTransferPayload type, bump version to 0.3.0"
```

---

### Task 3: Vault Transfer Encrypt/Decrypt Logic

**Files:**
- Create: `lib/qr/transfer.ts`
- Create: `lib/qr/__tests__/transfer.test.ts`

**Step 1: Write the failing tests**

```typescript
// lib/qr/__tests__/transfer.test.ts
import { buildTransferQR, decryptTransferPayload } from '../transfer';
import { parseQR } from '../protocol';

// These tests use the real crypto modules (lib/crypto/aes.ts and kdf.ts).
// They require the expo-crypto mock at lib/__mocks__/expo-crypto.ts.

describe('Vault Transfer', () => {
  const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const pin = '1234';

  test('buildTransferQR returns a nofm://vault/v1/ URI', async () => {
    const uri = await buildTransferQR({
      mnemonic,
      pin,
      name: 'Test Wallet',
      derivationPath: "m/44'/60'/0'/0",
      pathType: 'metamask',
      wordCount: 12,
      addressCount: 10,
      hasPassphrase: false,
    });
    expect(uri).toMatch(/^nofm:\/\/vault\/v1\//);
  });

  test('roundtrip: encrypt then decrypt recovers mnemonic', async () => {
    const uri = await buildTransferQR({
      mnemonic,
      pin,
      name: 'Test',
      derivationPath: "m/44'/60'/0'/0",
      pathType: 'metamask',
      wordCount: 12,
      addressCount: 10,
      hasPassphrase: false,
    });

    const parsed = parseQR(uri);
    expect(parsed.type).toBe('vault');
    if (parsed.type !== 'vault') throw new Error('unexpected');

    const recovered = await decryptTransferPayload(parsed.payload, pin);
    expect(recovered).toBe(mnemonic);
  });

  test('wrong PIN fails decryption', async () => {
    const uri = await buildTransferQR({
      mnemonic,
      pin,
      name: 'Test',
      derivationPath: "m/44'/60'/0'/0",
      pathType: 'metamask',
      wordCount: 12,
      addressCount: 10,
      hasPassphrase: false,
    });

    const parsed = parseQR(uri);
    if (parsed.type !== 'vault') throw new Error('unexpected');

    await expect(decryptTransferPayload(parsed.payload, '9999')).rejects.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest lib/qr/__tests__/transfer.test.ts --no-coverage`
Expected: FAIL -- module not found

**Step 3: Write the implementation**

```typescript
// lib/qr/transfer.ts
import { VaultTransferPayload, PathType, WordCount } from '../../constants/types';
import { encrypt, decrypt } from '../crypto/aes';
import { deriveKey, generateSalt } from '../crypto/kdf';
import { encodeVaultURI } from './protocol';

export interface TransferOptions {
  mnemonic: string;
  pin: string;
  name: string;
  derivationPath: string;
  pathType: PathType;
  wordCount: WordCount;
  addressCount: number;
  hasPassphrase: boolean;
}

export async function buildTransferQR(opts: TransferOptions): Promise<string> {
  const salt = generateSalt();
  const key = await deriveKey(opts.pin, salt);
  const encryptedMnemonic = await encrypt(opts.mnemonic, key);

  return encodeVaultURI(encryptedMnemonic, salt, {
    name: opts.name,
    derivationPath: opts.derivationPath,
    pathType: opts.pathType,
    wordCount: opts.wordCount,
    addressCount: opts.addressCount,
    hasPassphrase: opts.hasPassphrase,
  });
}

export async function decryptTransferPayload(
  payload: VaultTransferPayload,
  pin: string
): Promise<string> {
  const key = await deriveKey(pin, payload.salt);
  return decrypt(payload.mnemonic, key);
}
```

**Step 4: Run test to verify it passes**

Run: `npx jest lib/qr/__tests__/transfer.test.ts --no-coverage`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/qr/transfer.ts lib/qr/__tests__/transfer.test.ts
git commit -m "feat: add vault transfer encrypt/decrypt with PIN-derived keys"
```

---

### Task 4: QR Index Barrel Export

**Files:**
- Create: `lib/qr/index.ts`

**Step 1: Create barrel export**

```typescript
// lib/qr/index.ts
export { encodeShareURI, encodeVaultURI, parseQR } from './protocol';
export type { ParseResult, QRType, ParsedShare, ParsedVault, ParsedLegacy, ParsedUnknown } from './protocol';
export { buildTransferQR, decryptTransferPayload } from './transfer';
export type { TransferOptions } from './transfer';
```

**Step 2: Commit**

```bash
git add lib/qr/index.ts
git commit -m "feat: add lib/qr barrel export"
```

---

### Task 5: QR Center Logo Badge

**Files:**
- Create: `lib/qr/logo.ts`
- Modify: `components/QRCodeView.tsx`

**Step 1: Create logo SVG generator**

```typescript
// lib/qr/logo.ts

/**
 * Generates a data URI for a circular badge with text, used as
 * the center overlay on QR codes via react-native-qrcode-svg's logo prop.
 *
 * @param text - The text to display (e.g., "2/3" or "n/m")
 * @param size - Badge diameter in pixels
 */
export function generateLogoBadge(text: string, size: number = 48): string {
  const fontSize = Math.round(size * 0.38);
  const r = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${r}" cy="${r}" r="${r - 2}" fill="white" stroke="black" stroke-width="2"/>
    <text x="${r}" y="${r}" text-anchor="middle" dominant-baseline="central"
      font-family="Courier New, monospace" font-size="${fontSize}" font-weight="bold" fill="black">${text}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
```

**Step 2: Update QRCodeView to accept logo**

Replace the full content of `components/QRCodeView.tsx`:

```typescript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { NEO } from '../constants/theme';

interface QRCodeViewProps {
  value: string;
  size?: number;
  logoText?: string;
}

export function QRCodeView({ value, size = 200, logoText }: QRCodeViewProps) {
  const logoSize = Math.round(size * 0.15);

  return (
    <View style={[styles.container, { width: size + 24, height: size + 24 }]}>
      <QRCode
        value={value}
        size={size}
        backgroundColor={NEO.bg}
        color={NEO.text}
        ecl="H"
        {...(logoText ? {
          logo: { uri: generateLogoBadgeURI(logoText, logoSize) },
          logoSize,
          logoBackgroundColor: 'transparent',
        } : {})}
      />
    </View>
  );
}

function generateLogoBadgeURI(text: string, size: number): string {
  const fontSize = Math.round(size * 0.38);
  const r = size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${r}" cy="${r}" r="${r - 2}" fill="white" stroke="black" stroke-width="2"/>
    <text x="${r}" y="${r}" text-anchor="middle" dominant-baseline="central"
      font-family="Courier New, monospace" font-size="${fontSize}" font-weight="bold" fill="black">${escapeXml(text)}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const styles = StyleSheet.create({
  container: {
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEO.bg,
    padding: 12,
  },
});
```

**Step 3: Verify react-native-qrcode-svg supports logo prop**

Run: `npx jest components/__tests__/ --no-coverage` (existing component tests should still pass)

**Step 4: Commit**

```bash
git add lib/qr/logo.ts components/QRCodeView.tsx
git commit -m "feat: add center logo badge to QR codes with error correction H"
```

---

### Task 6: Update Scanner to Route QR Types

**Files:**
- Modify: `hooks/useScanner.ts`

**Step 1: Update useScanner to use parseQR**

Replace full content of `hooks/useScanner.ts`:

```typescript
import { useState, useCallback, useRef } from 'react';
import { SharePayload, VaultTransferPayload } from '../constants/types';
import { parseQR } from '../lib/qr/protocol';

export type ScanState = 'idle' | 'scanning' | 'pin_required' | 'reconstructing' | 'vault_import' | 'done' | 'error';

export function useScanner() {
  const [state, setState] = useState<ScanState>('idle');
  const [scannedShares, setScannedShares] = useState<SharePayload[]>([]);
  const [vaultTransfer, setVaultTransfer] = useState<VaultTransferPayload | null>(null);
  const [targetThreshold, setTargetThreshold] = useState(0);
  const [targetTotal, setTargetTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const secretIdRef = useRef<string | null>(null);

  const onScan = useCallback((data: string): boolean => {
    try {
      const result = parseQR(data);

      if (result.type === 'vault') {
        setVaultTransfer(result.payload);
        setState('vault_import');
        setError(null);
        return true;
      }

      // Handle both new URI shares and legacy JSON shares
      let payload: SharePayload;
      if (result.type === 'share') {
        payload = result.payload;
      } else if (result.type === 'legacy_share') {
        payload = result.payload;
      } else {
        setError('Invalid QR code - not a Shamir share or vault transfer');
        return false;
      }

      if (!payload.shareData) {
        setError('Invalid QR code - missing share data');
        return false;
      }

      let accepted = true;

      setScannedShares(prev => {
        // First share sets the target
        if (prev.length === 0) {
          secretIdRef.current = payload.id;
          setTargetThreshold(payload.threshold);
          setTargetTotal(payload.totalShares);
        } else {
          if (payload.id !== secretIdRef.current) {
            setError('This share belongs to a different secret');
            accepted = false;
            return prev;
          }
          if (prev.some(s => s.shareIndex === payload.shareIndex)) {
            setError(`Share #${payload.shareIndex} already scanned`);
            accepted = false;
            return prev;
          }
        }

        setError(null);
        const updated = [...prev, payload];

        if (updated.length >= payload.threshold) {
          if (payload.hasPIN || payload.hasPassphrase) {
            setState('pin_required');
          } else {
            setState('reconstructing');
          }
        }

        return updated;
      });

      return accepted;
    } catch {
      setError('Could not parse QR code');
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setScannedShares([]);
    setVaultTransfer(null);
    setTargetThreshold(0);
    setTargetTotal(0);
    setError(null);
    secretIdRef.current = null;
  }, []);

  return {
    state, setState,
    scannedShares,
    vaultTransfer,
    targetThreshold, targetTotal,
    error, setError,
    onScan, reset,
  };
}
```

**Step 2: Run existing scanner tests**

Run: `npx jest hooks/__tests__/useScanner.test.tsx --no-coverage`
Expected: Some tests may need updating due to the `v !== 1` check being removed (now handled by parseQR). Update any failing assertions.

**Step 3: Commit**

```bash
git add hooks/useScanner.ts hooks/__tests__/useScanner.test.tsx
git commit -m "feat: update scanner to route nofm:// URI shares and vault transfers"
```

---

### Task 7: Scan Screen -- Route Vault Transfers

**Files:**
- Modify: `app/(tabs)/scan/index.tsx:44-56` (navigation effect)

**Step 1: Add vault_import navigation**

In `app/(tabs)/scan/index.tsx`, update the `useEffect` (lines 44-56) to handle `vault_import`:

```typescript
  useEffect(() => {
    if (navigatedRef.current) return;

    if (scanner.state === 'pin_required') {
      navigatedRef.current = true;
      update({ shares: scanner.scannedShares });
      router.push('/(tabs)/scan/pin');
    } else if (scanner.state === 'reconstructing') {
      navigatedRef.current = true;
      update({ shares: scanner.scannedShares });
      router.push('/(tabs)/scan/result');
    } else if (scanner.state === 'vault_import') {
      navigatedRef.current = true;
      router.push('/(tabs)/scan/import');
    }
  }, [scanner.state, scanner.scannedShares, update]);
```

**Step 2: Commit**

```bash
git add "app/(tabs)/scan/index.tsx"
git commit -m "feat: route vault transfer QR scans to import screen"
```

---

### Task 8: Vault Import Screen

**Files:**
- Create: `app/(tabs)/scan/import.tsx`

**Step 1: Create the import screen**

```typescript
// app/(tabs)/scan/import.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as ExpoCrypto from 'expo-crypto';
import { NeoButton, NeoCard, NeoInput } from '../../../components/neo';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useScanner } from '../../../hooks/useScanner';
import { useVault } from '../../../hooks/useVault';
import { decryptTransferPayload } from '../../../lib/qr/transfer';
import { validateMnemonic, deriveAddresses } from '../../../lib/wallet';
import { SecretRecord } from '../../../constants/types';

export default function ImportScreen() {
  const { highlight } = useTheme();
  const scanner = useScanner();
  const { save } = useVault();

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payload = scanner.vaultTransfer;

  const handleImport = useCallback(async () => {
    if (!payload) return;
    if (!pin.trim()) {
      setError('PIN is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mnemonic = await decryptTransferPayload(payload, pin.trim());

      if (!validateMnemonic(mnemonic.trim())) {
        setError('Decryption produced an invalid mnemonic. Check your PIN and try again.');
        setLoading(false);
        return;
      }

      const cleaned = mnemonic.trim();
      const addresses = deriveAddresses(cleaned, payload.pathType, payload.addressCount);

      const record: SecretRecord = {
        id: ExpoCrypto.randomUUID(),
        name: payload.name,
        createdAt: Date.now(),
        mnemonic: cleaned,
        wordCount: payload.wordCount,
        derivationPath: payload.derivationPath,
        pathType: payload.pathType,
        addressCount: payload.addressCount,
        addresses,
        shamirConfig: { threshold: 0, totalShares: 0 },
        hasPassphrase: payload.hasPassphrase,
        hasPIN: false,
      };

      await save(record);
      scanner.reset();
      router.replace(`/(tabs)/vault/${record.id}`);
    } catch (err) {
      if (__DEV__) console.error('Import error:', err);
      setError('Invalid PIN or corrupted data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [payload, pin, save, scanner]);

  if (!payload) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <NeoCard title="Error">
          <Text style={styles.text}>No vault transfer data. Go back and scan a vault QR code.</Text>
          <NeoButton title="Go Back" variant="secondary" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </NeoCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Import Vault</Text>
      <Text style={styles.subtitle}>
        A vault transfer QR code was scanned. Enter the transfer PIN to decrypt and import.
      </Text>

      <NeoCard title="Transfer Details">
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{payload.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Words</Text>
          <Text style={styles.value}>{payload.wordCount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Path</Text>
          <Text style={styles.value}>{payload.derivationPath}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Addresses</Text>
          <Text style={styles.value}>{payload.addressCount}</Text>
        </View>
      </NeoCard>

      <NeoCard title="Transfer PIN" style={{ marginTop: 16 }}>
        <NeoInput
          label="PIN"
          value={pin}
          onChangeText={setPin}
          placeholder="Enter the transfer PIN"
          keyboardType="number-pad"
          secureTextEntry
          mono
        />
      </NeoCard>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <NeoButton
        title={loading ? 'Importing...' : 'Import to Vault'}
        onPress={handleImport}
        disabled={loading || !pin.trim()}
        style={{ marginTop: 24 }}
      />

      {loading && (
        <ActivityIndicator size="large" color={highlight} style={{ marginTop: 16 }} />
      )}

      <NeoButton
        title="Cancel"
        variant="secondary"
        onPress={() => { scanner.reset(); router.back(); }}
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg },
  content: { padding: 16, paddingBottom: 40 },
  heading: {
    fontFamily: NEO.fontUIBold, fontSize: 24, color: NEO.text,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  subtitle: {
    fontFamily: NEO.fontUI, fontSize: 15, color: '#666',
    marginBottom: 20, lineHeight: 22,
  },
  text: { fontFamily: NEO.fontUI, fontSize: 15, color: NEO.text, lineHeight: 22 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#EEE',
  },
  label: {
    fontFamily: NEO.fontUIBold, fontSize: 13, color: '#666', textTransform: 'uppercase',
  },
  value: { fontFamily: NEO.fontMono, fontSize: 13, color: NEO.text },
  errorBox: { borderWidth: 2, borderColor: '#CC0000', padding: 12, marginTop: 16 },
  errorText: { fontFamily: NEO.fontUI, fontSize: 14, color: '#CC0000', lineHeight: 20 },
});
```

**Step 2: Commit**

```bash
git add "app/(tabs)/scan/import.tsx"
git commit -m "feat: add vault import screen with PIN decryption"
```

---

### Task 9: Vault Transfer Export Screen

**Files:**
- Create: `app/(tabs)/vault/transfer.tsx`
- Modify: `app/(tabs)/vault/[id].tsx` (add Transfer button + modal)

**Step 1: Add transfer state and handler to vault detail**

In `app/(tabs)/vault/[id].tsx`, add these state variables after line 72 (`exportQRVisible`):

```typescript
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferPin, setTransferPin] = useState('');
  const [transferPinConfirm, setTransferPinConfirm] = useState('');
  const [transferQR, setTransferQR] = useState<string | null>(null);
  const [transferLoading, setTransferLoading] = useState(false);
```

Add this import at the top (after existing imports):

```typescript
import { buildTransferQR } from '../../../lib/qr/transfer';
```

Add this handler after `handleExportConfirm` (after line 255):

```typescript
  const handleTransfer = useCallback(async () => {
    if (!secret) return;
    if (transferPin.length < 4) return;
    if (transferPin !== transferPinConfirm) return;

    setTransferLoading(true);
    try {
      const uri = await buildTransferQR({
        mnemonic: secret.mnemonic,
        pin: transferPin,
        name: secret.name,
        derivationPath: secret.derivationPath,
        pathType: secret.pathType,
        wordCount: secret.wordCount,
        addressCount: secret.addressCount,
        hasPassphrase: secret.hasPassphrase,
      });
      setTransferQR(uri);
    } catch (err) {
      if (__DEV__) console.error('Transfer QR error:', err);
      Alert.alert('Error', 'Failed to generate transfer QR.');
    } finally {
      setTransferLoading(false);
    }
  }, [secret, transferPin, transferPinConfirm]);
```

**Step 2: Add Transfer button to the UI**

In the JSX, after the "Export Data (Expert)" button (line 512), add:

```typescript
        {/* Transfer to another device */}
        <NeoButton
          title="Transfer to Device"
          variant="secondary"
          onPress={() => {
            setTransferPin('');
            setTransferPinConfirm('');
            setTransferQR(null);
            setTransferModalVisible(true);
          }}
          disabled={isLocked}
          style={{ marginTop: 12 }}
        />
```

**Step 3: Add Transfer modal**

After the Export QR Modal (after line 637, before the closing `</>`), add:

```typescript
      {/* Transfer QR Modal */}
      <NeoModal
        visible={transferModalVisible}
        onClose={() => setTransferModalVisible(false)}
        title="Transfer to Device"
      >
        {!transferQR ? (
          <>
            <Text style={styles.bodyText}>
              Generate a PIN-encrypted QR code to transfer this vault entry to another device.
            </Text>
            <View style={{ marginTop: 16 }}>
              <NeoInput
                label="Transfer PIN (4-6 digits)"
                value={transferPin}
                onChangeText={(t: string) => setTransferPin(t.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="Enter PIN"
                keyboardType="number-pad"
                secureTextEntry
                mono
              />
            </View>
            <View style={{ marginTop: 12 }}>
              <NeoInput
                label="Confirm PIN"
                value={transferPinConfirm}
                onChangeText={(t: string) => setTransferPinConfirm(t.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="Confirm PIN"
                keyboardType="number-pad"
                secureTextEntry
                mono
              />
            </View>
            {transferPin.length > 0 && transferPin.length < 4 && (
              <Text style={styles.validationHint}>PIN must be at least 4 digits</Text>
            )}
            {transferPinConfirm.length > 0 && transferPin !== transferPinConfirm && (
              <Text style={styles.validationHint}>PINs do not match</Text>
            )}
            <NeoButton
              title={transferLoading ? 'Generating...' : 'Generate QR'}
              onPress={handleTransfer}
              disabled={transferLoading || transferPin.length < 4 || transferPin !== transferPinConfirm}
              style={{ marginTop: 20 }}
            />
          </>
        ) : (
          <>
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                SCAN THIS QR FROM ANOTHER DEVICE -- YOU WILL NEED THE PIN TO IMPORT
              </Text>
            </View>
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <QRCodeView value={transferQR} size={260} logoText="n/m" />
            </View>
            <NeoButton
              title="Done"
              variant="secondary"
              onPress={() => setTransferModalVisible(false)}
              style={{ marginTop: 20 }}
            />
          </>
        )}
      </NeoModal>
```

**Step 4: Add the validationHint style**

In the `styles` StyleSheet (after `exportActions` around line 812), add:

```typescript
  validationHint: {
    fontFamily: NEO.fontUI,
    fontSize: 12,
    color: '#CC0000',
    marginTop: 4,
  },
```

**Step 5: Commit**

```bash
git add "app/(tabs)/vault/[id].tsx"
git commit -m "feat: add vault transfer export with PIN-encrypted QR code"
```

---

### Task 10: Update Share Generation to Use v2 URI

**Files:**
- Modify: `app/(tabs)/generate/metadata.tsx:73-87` (share payload generation)
- Modify: `app/(tabs)/vault/[id].tsx:149-171` (buildSharePayloads)

**Step 1: Update metadata.tsx**

In `app/(tabs)/generate/metadata.tsx`, add import:

```typescript
import { encodeShareURI } from '../../../lib/qr';
```

Change line 74 (`v: 1 as const`) to `v: 2 as const`.

The QR data encoding is done at the preview/PDF stage, not here. The payloads are passed as objects and JSON-stringified later. We need to update the PDF generation to use `encodeShareURI` instead of `JSON.stringify`.

**Step 2: Update vault detail buildSharePayloads**

In `app/(tabs)/vault/[id].tsx`, change line 157 (`v: 1 as const`) to `v: 2 as const`.

**Step 3: Update PDF template QR data generation**

In `lib/pdf/generate.ts`, find where `JSON.stringify(share)` is called to produce qrDatas and replace with `encodeShareURI(share)`.

Read `lib/pdf/generate.ts` first to find the exact location.

**Step 4: Commit**

```bash
git add "app/(tabs)/generate/metadata.tsx" "app/(tabs)/vault/[id].tsx" lib/pdf/generate.ts
git commit -m "feat: generate v2 shares with nofm:// URI encoding"
```

---

### Task 11: Update PDF QR Codes -- Error Correction H + Logo Overlay

**Files:**
- Modify: `lib/pdf/templates.ts` (QRious level 'M' -> 'H', add center badge CSS overlay)

**Step 1: Bump error correction in renderSingleCardHTML**

In `lib/pdf/templates.ts`, change line 174 `level: 'M'` to `level: 'H'`.

**Step 2: Bump error correction in renderPageHTML**

In `lib/pdf/templates.ts`, change line 235 `level: 'M'` to `level: 'H'`.

**Step 3: Add center badge overlay in CSS**

In the `.share-qr` CSS in renderPageHTML (around line 370), add:

```css
  .share-qr { position: relative; }
  .qr-badge {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 15%;
    height: 15%;
    background: white;
    border: 2px solid black;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    font-size: 10px;
  }
```

In `renderCardHTML`, after the canvas element (line 67), add:

```html
<div class="qr-badge">${share.threshold}/${share.totalShares}</div>
```

**Step 4: Commit**

```bash
git add lib/pdf/templates.ts
git commit -m "feat: bump QR error correction to H, add center badge overlay in PDF cards"
```

---

### Task 12: Export/Import Spec Document

**Files:**
- Create: `docs/export-import.md`

**Step 1: Write the spec**

```markdown
# n-of-m QR Protocol Specification

## Version

Protocol version: 2 (shares), 1 (vault transfer)
App version: 0.3.0

## URI Scheme

All QR codes use the `nofm://` URI scheme:

    nofm://share/v2/{base64url-payload}
    nofm://vault/v1/{base64url-payload}

Payload is base64url-encoded JSON (RFC 4648 section 5, no padding).

### Backward Compatibility

Scanners MUST also accept raw JSON payloads (no URI prefix) where `v === 1`
and `shareData` is present. This supports cards printed before v0.3.0.

## Share Payload (v2)

```json
{
  "v": 2,
  "id": "uuid",
  "name": "Secret Name",
  "shareIndex": 1,
  "totalShares": 3,
  "threshold": 2,
  "shareData": "hex-encoded-shamir-share",
  "derivationPath": "m/44'/60'/0'/0",
  "pathType": "metamask",
  "wordCount": 12,
  "metadata": {},
  "hasPIN": false,
  "hasPassphrase": false
}
```

## Vault Transfer Payload (v1)

Used for PIN-encrypted device-to-device transfer.

```json
{
  "v": 1,
  "name": "Secret Name",
  "mnemonic": "hex-aes-gcm-ciphertext",
  "derivationPath": "m/44'/60'/0'/0",
  "pathType": "metamask",
  "wordCount": 12,
  "addressCount": 10,
  "hasPassphrase": false,
  "salt": "hex-16-byte-random"
}
```

### Encryption

- Key: PBKDF2-SHA256(pin, salt, 10000 iterations) -> 256-bit key (64 hex chars)
- Cipher: AES-256-GCM with 12-byte random nonce
- Ciphertext format: `{24-char-hex-nonce}{ciphertext-hex}`
- The `mnemonic` field contains this ciphertext, NOT plaintext

### Export Flow

1. User selects vault entry, taps "Transfer to Device"
2. User enters and confirms a 4-6 digit PIN
3. App generates 16-byte random salt
4. App derives key: PBKDF2-SHA256(pin, salt, 10000)
5. App encrypts mnemonic: AES-256-GCM(mnemonic, key)
6. App builds VaultTransferPayload, base64url-encodes, wraps in `nofm://vault/v1/`
7. QR code rendered with "n/m" center badge, error correction H

### Import Flow

1. Scanner detects `nofm://vault/v1/` prefix
2. App navigates to import PIN screen
3. User enters the transfer PIN
4. App derives key from PIN + payload.salt
5. App decrypts mnemonic, validates BIP39 checksum
6. On success: derives addresses, saves to vault
7. On failure: shows "Invalid PIN" error

## QR Center Badge

All share and vault QR codes include a center badge overlay:
- Share QR: shows threshold fraction (e.g., "2/3")
- Vault transfer QR: shows "n/m"
- Badge: white circle, 2px black border, ~15% of QR width
- Error correction: H (30% recovery) to compensate for occluded center

## Scanner Routing Pseudocode

```
function route(data):
  if data.startsWith("nofm://share/v2/"):
    payload = base64url_decode(data.slice(17))
    -> share flow
  elif data.startsWith("nofm://vault/v1/"):
    payload = base64url_decode(data.slice(17))
    -> vault import flow (prompt for PIN)
  elif isJSON(data) and data.v == 1 and data.shareData:
    -> legacy share flow
  else:
    -> error: unrecognized QR code
```
```

**Step 2: Commit**

```bash
git add docs/export-import.md
git commit -m "docs: add QR protocol and vault transfer specification"
```

---

### Task 13: Card Layout Spec Document

**Files:**
- Create: `docs/card-layouts.md`

**Step 1: Write the canonical layout spec**

This documents the layout system for cross-platform consistency. Content is based on the explored iOS and web implementations, with canonical values chosen where they differed.

The spec should contain:

1. Common properties (font family, margins, borders, shadow, error correction)
2. Layout variant table (full-page, compact, wallet-size) with all dimensions
3. Card anatomy section-by-section (header, instructions, date, notes, bottom, footer)
4. CSS reference for each section
5. QR rendering notes (QRious for HTML/PDF, react-native-qrcode-svg for native)
6. Center badge overlay CSS

Use the values from the design doc (Task 4 of design, section "Card Layout Specification").

**Step 2: Commit**

```bash
git add docs/card-layouts.md
git commit -m "docs: add canonical card layout specification for cross-platform consistency"
```

---

### Task 14: Integration Verification

**Step 1: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Run Expo export**

```bash
npx expo export 2>&1 | tail -5
```

Expected: Bundles produced successfully.

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: integration fixes from verification"
```

**Step 5: Push**

```bash
git push origin main
```
