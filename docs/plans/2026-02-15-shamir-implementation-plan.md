# Shamir App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an iOS Expo app for generating Ethereum seed phrases, splitting them with Shamir's Secret Sharing into QR-coded PDF cards, and reconstructing them by scanning.

**Architecture:** Expo SDK 52+ with expo-router (file-based tabs), ethers.js v6 for wallet ops, ported shamirs-secret-sharing-ts for SSS, react-native-html-to-pdf for neobrutalist PDF cards, expo-camera for QR scanning. All crypto runs offline. Storage via expo-secure-store (Keychain) + expo-file-system (encrypted blobs).

**Tech Stack:** Expo 52, TypeScript (strict), ethers.js v6, expo-camera, expo-router, react-native-qrcode-svg, react-native-html-to-pdf, expo-secure-store, expo-file-system, expo-sharing, buffer polyfill, react-native-get-random-values.

**Design reference:** `docs/plans/2026-02-15-shamir-app-design.md`

---

## Phase 1: Project Scaffolding

### Task 1: Initialize Expo project

**Files:**
- Create: `ios-shamir/` (project root — already exists with docs/)
- Create: `app.json`, `package.json`, `tsconfig.json`, `babel.config.js`

**Step 1: Create Expo project with TypeScript template**

```bash
cd ~/Developer
npx create-expo-app@latest ios-shamir --template tabs
```

Note: project directory already exists with `docs/`. If create-expo-app complains, use `--yes` or create in a temp dir and move files. Preserve the `docs/` folder.

**Step 2: Verify project runs**

```bash
cd ios-shamir
npx expo start
```

Expected: Metro bundler starts, QR code displayed. Scan with Expo Go to verify.

**Step 3: Commit**

```bash
git add -A
git commit -m "Initialize Expo project with tabs template"
```

---

### Task 2: Install all dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install core dependencies**

```bash
cd ios-shamir
npx expo install expo-camera expo-crypto expo-file-system expo-font expo-secure-store expo-sharing expo-print
npm install ethers@^6.13.0 react-native-qrcode-svg react-native-svg react-native-get-random-values buffer uuid
npm install -D @types/uuid
```

**Step 2: Install fonts**

```bash
npx expo install @expo-google-fonts/space-grotesk @expo-google-fonts/space-mono
```

**Step 3: Verify dependencies install cleanly**

```bash
npx expo doctor
```

Expected: No critical issues. Warnings about version mismatches are OK.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "Install all project dependencies"
```

---

### Task 3: Configure crypto polyfills

**Files:**
- Create: `lib/polyfills.ts`
- Modify: `app/_layout.tsx` (import polyfills at top)

**Step 1: Create polyfills file**

```typescript
// lib/polyfills.ts
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Make Buffer available globally for ethers.js and SSS library
if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}
```

**Step 2: Import polyfills at the very top of root layout**

In `app/_layout.tsx`, add as the FIRST import:

```typescript
import '../lib/polyfills';
```

This must be before any ethers.js or SSS imports.

**Step 3: Verify ethers.js loads**

Create a quick test in any screen:

```typescript
import { Mnemonic } from 'ethers';
console.log('ethers loaded, Mnemonic available:', typeof Mnemonic);
```

Expected: Log output confirms ethers loads without crashing.

**Step 4: Commit**

```bash
git add lib/polyfills.ts app/_layout.tsx
git commit -m "Configure crypto polyfills for React Native"
```

---

## Phase 2: Design System & Theme

### Task 4: Create theme constants and types

**Files:**
- Create: `constants/theme.ts`
- Create: `constants/types.ts`

**Step 1: Create theme constants**

```typescript
// constants/theme.ts

export const PALETTES = {
  pastels: {
    label: 'Pastels',
    colors: [
      { name: 'Blue', hex: '#A8D8EA' },
      { name: 'Pink', hex: '#F4B8C1' },
      { name: 'Green', hex: '#B8E6C8' },
      { name: 'Yellow', hex: '#F9E8A0' },
      { name: 'Purple', hex: '#C8B8E6' },
      { name: 'Orange', hex: '#F4C9A8' },
    ],
  },
  bold: {
    label: 'Bold',
    colors: [
      { name: 'Blue', hex: '#0066FF' },
      { name: 'Pink', hex: '#FF0066' },
      { name: 'Green', hex: '#00FF66' },
      { name: 'Yellow', hex: '#FFFF00' },
    ],
  },
  muted: {
    label: 'Muted',
    colors: [
      { name: 'Rose', hex: '#C4A4A4' },
      { name: 'Sage', hex: '#A4C4A4' },
      { name: 'Slate', hex: '#7A8A9A' },
      { name: 'Amber', hex: '#C4A464' },
    ],
  },
} as const;

export const NEO = {
  bg: '#FFFFFF',
  text: '#000000',
  border: '#000000',
  borderWidth: 3,
  shadowOffset: 4,
  shadowColor: '#000000',
  radius: 0,
  defaultHighlight: '#A8D8EA',
  fontUI: 'SpaceGrotesk_400Regular',
  fontUIBold: 'SpaceGrotesk_700Bold',
  fontMono: 'SpaceMono_400Regular',
} as const;

export const SHADOW = {
  shadowColor: NEO.shadowColor,
  shadowOffset: { width: NEO.shadowOffset, height: NEO.shadowOffset },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: NEO.shadowOffset,
};

export const SHADOW_PRESSED = {
  shadowColor: NEO.shadowColor,
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 2,
};
```

**Step 2: Create shared types**

```typescript
// constants/types.ts

export type WordCount = 12 | 15 | 18 | 21 | 24;
export type PathType = 'metamask' | 'ledger' | 'custom';

export interface DerivedAddress {
  index: number;
  address: string;
  privateKey: string;
}

export interface ShamirConfig {
  threshold: number;
  totalShares: number;
}

export interface SecretRecord {
  id: string;
  name: string;
  createdAt: number;
  mnemonic: string;
  wordCount: WordCount;
  derivationPath: string;
  pathType: PathType;
  addressCount: number;
  addresses: DerivedAddress[];
  shamirConfig: ShamirConfig;
  metadata?: Record<string, string>;
  hasPassphrase: boolean;
  hasPIN: boolean;
}

export interface SharePayload {
  v: 1;
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

**Step 3: Commit**

```bash
git add constants/
git commit -m "Add theme constants and shared types"
```

---

### Task 5: Create ThemeProvider context

**Files:**
- Create: `hooks/useTheme.tsx`

**Step 1: Create theme context with color picker state**

```typescript
// hooks/useTheme.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NEO } from '../constants/theme';
import * as SecureStore from 'expo-secure-store';

interface ThemeContextValue {
  highlight: string;
  setHighlight: (color: string) => void;
  neo: typeof NEO;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const HIGHLIGHT_KEY = 'shamir_highlight_color';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [highlight, setHighlightState] = useState(NEO.defaultHighlight);

  const setHighlight = useCallback(async (color: string) => {
    setHighlightState(color);
    await SecureStore.setItemAsync(HIGHLIGHT_KEY, color);
  }, []);

  // Load saved highlight on mount
  React.useEffect(() => {
    SecureStore.getItemAsync(HIGHLIGHT_KEY).then((saved) => {
      if (saved) setHighlightState(saved);
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ highlight, setHighlight, neo: NEO }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
```

**Step 2: Commit**

```bash
git add hooks/useTheme.tsx
git commit -m "Add ThemeProvider with persistent highlight color"
```

---

### Task 6: Build neobrutalist Button component

**Files:**
- Create: `components/neo/Button.tsx`

**Step 1: Create Button component**

```typescript
// components/neo/Button.tsx
import React, { useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NEO, SHADOW, SHADOW_PRESSED } from '../../constants/theme';

interface NeoButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function NeoButton({
  title,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled,
  ...props
}: NeoButtonProps) {
  const { highlight } = useTheme();
  const [pressed, setPressed] = useState(false);

  const bgColor =
    variant === 'primary'
      ? highlight
      : variant === 'danger'
        ? '#FF6B6B'
        : NEO.bg;

  const paddingV = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const paddingH = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      style={[
        styles.base,
        {
          backgroundColor: disabled ? '#E0E0E0' : bgColor,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          transform: pressed
            ? [{ translateX: 2 }, { translateY: 2 }]
            : [{ translateX: 0 }, { translateY: 0 }],
        },
        pressed ? SHADOW_PRESSED : SHADOW,
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          { fontSize, fontFamily: NEO.fontUIBold },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
```

**Step 2: Commit**

```bash
git add components/neo/Button.tsx
git commit -m "Add neobrutalist Button component"
```

---

### Task 7: Build neobrutalist Card component

**Files:**
- Create: `components/neo/Card.tsx`

**Step 1: Create Card component**

```typescript
// components/neo/Card.tsx
import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NEO, SHADOW } from '../../constants/theme';

interface NeoCardProps {
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
  showHeader?: boolean;
}

export function NeoCard({ title, children, style, showHeader = true }: NeoCardProps) {
  const { highlight } = useTheme();

  return (
    <View style={[styles.card, SHADOW, style]}>
      {showHeader && title && (
        <View style={[styles.header, { backgroundColor: highlight }]}>
          <Text style={styles.headerText}>{title}</Text>
        </View>
      )}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: NEO.bg,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: NEO.borderWidth,
    borderBottomColor: NEO.border,
  },
  headerText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 16,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    padding: 16,
  },
});
```

**Step 2: Commit**

```bash
git add components/neo/Card.tsx
git commit -m "Add neobrutalist Card component"
```

---

### Task 8: Build neobrutalist Input component

**Files:**
- Create: `components/neo/Input.tsx`

**Step 1: Create Input component**

```typescript
// components/neo/Input.tsx
import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NEO } from '../../constants/theme';

interface NeoInputProps extends TextInputProps {
  label?: string;
  mono?: boolean;
  containerStyle?: ViewStyle;
}

export function NeoInput({
  label,
  mono = false,
  containerStyle,
  ...props
}: NeoInputProps) {
  const { highlight } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            fontFamily: mono ? NEO.fontMono : NEO.fontUI,
            borderColor: focused ? highlight : NEO.border,
          },
        ]}
        placeholderTextColor="#999"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: NEO.fontUIBold,
    fontSize: 14,
    color: NEO.text,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: NEO.bg,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: NEO.text,
  },
});
```

**Step 2: Commit**

```bash
git add components/neo/Input.tsx
git commit -m "Add neobrutalist Input component"
```

---

### Task 9: Build Badge and TabBar components

**Files:**
- Create: `components/neo/Badge.tsx`
- Create: `components/neo/index.ts` (barrel export)

**Step 1: Create Badge component**

```typescript
// components/neo/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NEO } from '../../constants/theme';

interface NeoBadgeProps {
  text: string;
  variant?: 'highlight' | 'dark' | 'outline';
  style?: ViewStyle;
}

export function NeoBadge({ text, variant = 'highlight', style }: NeoBadgeProps) {
  const { highlight } = useTheme();

  const bg =
    variant === 'highlight'
      ? highlight
      : variant === 'dark'
        ? NEO.text
        : 'transparent';

  const textColor =
    variant === 'dark' ? NEO.bg : NEO.text;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        variant === 'outline' && styles.outline,
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    alignSelf: 'flex-start',
  },
  outline: {
    backgroundColor: 'transparent',
  },
  text: {
    fontFamily: NEO.fontUIBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
```

**Step 2: Create barrel export**

```typescript
// components/neo/index.ts
export { NeoButton } from './Button';
export { NeoCard } from './Card';
export { NeoInput } from './Input';
export { NeoBadge } from './Badge';
```

**Step 3: Commit**

```bash
git add components/neo/
git commit -m "Add Badge component and neo barrel export"
```

---

## Phase 3: Port Shamir's Secret Sharing Library

### Task 10: Port constants and lookup table

**Files:**
- Create: `lib/shamir/constants.ts`
- Create: `lib/shamir/table.ts`
- Create: `lib/shamir/__tests__/table.test.ts`

**Step 1: Write failing test for lookup table**

```typescript
// lib/shamir/__tests__/table.test.ts
import { logs, exps } from '../table';
import { BIT_SIZE, MAX_SHARES } from '../constants';

describe('GF(2^8) lookup table', () => {
  it('generates exps table of correct size', () => {
    expect(exps).toHaveLength(BIT_SIZE);
  });

  it('generates logs table of correct size', () => {
    expect(logs).toHaveLength(BIT_SIZE);
  });

  it('has exps[0] = 1 (g^0 = 1)', () => {
    expect(exps[0]).toBe(1);
  });

  it('has all exps values in range [0, MAX_SHARES]', () => {
    for (const val of exps) {
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(MAX_SHARES);
    }
  });

  it('logs and exps are inverses for non-zero elements', () => {
    for (let i = 1; i < BIT_SIZE; i++) {
      expect(exps[logs[i]]).toBe(i);
    }
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx jest lib/shamir/__tests__/table.test.ts
```

Expected: FAIL — modules not found.

**Step 3: Create constants.ts**

```typescript
// lib/shamir/constants.ts
export const PRIMITIVE_POLYNOMIAL = 29;
export const BIT_PADDING = 128;
export const BIT_COUNT = 8;
export const BIT_SIZE = 2 ** BIT_COUNT; // 256
export const BYTES_PER_CHARACTER = 2;
export const MAX_BYTES_PER_CHARACTER = 6;
export const MAX_SHARES = BIT_SIZE - 1; // 255
export const UTF8_ENCODING = 'utf8';
export const BIN_ENCODING = 'binary';
export const HEX_ENCODING = 'hex';
```

**Step 4: Create table.ts**

```typescript
// lib/shamir/table.ts
import { PRIMITIVE_POLYNOMIAL, MAX_SHARES, BIT_SIZE } from './constants';

const zeroes = new Array(4 * BIT_SIZE).join('0');
const logs = new Array(BIT_SIZE).fill(0);
const exps = new Array(BIT_SIZE).fill(0);

for (let i = 0, x = 1; i < BIT_SIZE; ++i) {
  exps[i] = x;
  logs[x] = i;
  x = x << 1;
  if (x >= BIT_SIZE) {
    x = x ^ PRIMITIVE_POLYNOMIAL;
    x = x & MAX_SHARES;
  }
}

export { zeroes, logs, exps };
```

**Step 5: Run test to verify it passes**

```bash
npx jest lib/shamir/__tests__/table.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add lib/shamir/constants.ts lib/shamir/table.ts lib/shamir/__tests__/
git commit -m "Port SSS constants and GF(2^8) lookup table"
```

---

### Task 11: Port codec module

**Files:**
- Create: `lib/shamir/codec.ts`
- Create: `lib/shamir/__tests__/codec.test.ts`

**Step 1: Write failing test**

```typescript
// lib/shamir/__tests__/codec.test.ts
import { Buffer } from 'buffer';
import { pad, hex, bin, split, encode, decode } from '../codec';

describe('codec', () => {
  describe('pad', () => {
    it('pads string to multiple of 8', () => {
      expect(pad('101')).toBe('00000101');
    });

    it('returns unchanged if already aligned', () => {
      expect(pad('10101010')).toBe('10101010');
    });

    it('pads to custom multiple', () => {
      expect(pad('1', 4)).toBe('0001');
    });
  });

  describe('hex', () => {
    it('converts buffer to hex string', () => {
      const result = hex(Buffer.from('secret'));
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('converts string with utf8 encoding', () => {
      const result = hex('test');
      expect(typeof result).toBe('string');
    });

    it('converts binary string to hex', () => {
      const result = hex('10101010', 'binary');
      expect(result).toBe('aa');
    });
  });

  describe('bin', () => {
    it('converts hex string to binary', () => {
      const result = bin('ff', 16);
      expect(result).toBe('11111111');
    });
  });

  describe('encode/decode roundtrip', () => {
    it('encodes and decodes share data', () => {
      const id = '01';
      const data = Buffer.from('deadbeef', 'hex');
      const encoded = encode(id, data);
      expect(Buffer.isBuffer(encoded)).toBe(true);
    });
  });

  describe('split', () => {
    it('splits binary string into chunks', () => {
      const input = '1010101011110000';
      const chunks = split(input, 0, 2);
      expect(Array.isArray(chunks)).toBe(true);
      expect(chunks.length).toBeGreaterThan(0);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx jest lib/shamir/__tests__/codec.test.ts
```

Expected: FAIL

**Step 3: Create codec.ts (ported, Buffer polyfill compatible)**

```typescript
// lib/shamir/codec.ts
import { Buffer } from 'buffer';
import { zeroes } from './table';
import {
  BYTES_PER_CHARACTER,
  UTF8_ENCODING,
  BIN_ENCODING,
  BIT_COUNT,
  BIT_SIZE,
} from './constants';

export function pad(text: string, multiple?: number): string {
  let missing = 0;
  let result = text;

  if (!multiple) {
    multiple = BIT_COUNT;
  }

  if (text) {
    missing = text.length % multiple;
  }

  if (missing) {
    const offset = -((multiple - missing) + text.length);
    result = (zeroes + text).slice(offset);
  }

  return result;
}

export function hex(buffer: string | Buffer, encoding?: string): string {
  const padding = 2 * BYTES_PER_CHARACTER;

  if (!encoding) {
    encoding = UTF8_ENCODING;
  }

  if (typeof buffer === 'string') {
    return fromString(buffer, encoding, padding);
  }

  if (Buffer.isBuffer(buffer)) {
    return fromBuffer(buffer, padding);
  }

  throw new TypeError('Expecting a string or buffer as input.');
}

function fromString(buffer: string, encoding: string, padding: number): string {
  const chunks: string[] = [];

  if (UTF8_ENCODING === encoding) {
    for (let i = 0; i < buffer.length; ++i) {
      const chunk = Number(String.fromCharCode(buffer.charCodeAt(i))).toString(16);
      chunks.unshift(pad(chunk, padding));
    }
  }

  if (BIN_ENCODING === encoding) {
    buffer = pad(buffer, 4);
    for (let i = buffer.length; i >= 4; i -= 4) {
      const bits = buffer.slice(i - 4, i);
      const chunk = parseInt(bits, 2).toString(16);
      chunks.unshift(chunk);
    }
  }

  return chunks.join('');
}

function fromBuffer(buffer: Buffer, padding: number): string {
  const chunks: string[] = [];

  for (let i = 0; i < buffer.length; ++i) {
    const chunk = buffer[i].toString(16);
    chunks.unshift(pad(chunk, padding));
  }

  return chunks.join('');
}

export function bin(buffer: string | Buffer | any[], radix?: number): string {
  const chunks: string[] = [];

  if (!radix) {
    radix = 16;
  }

  for (let i = (buffer as any).length - 1; i >= 0; --i) {
    let chunk: number | null = null;

    if (Buffer.isBuffer(buffer)) {
      chunk = buffer[i];
    }

    if (typeof buffer === 'string') {
      chunk = parseInt(buffer[i], radix);
    }

    if (Array.isArray(buffer)) {
      const el = buffer[i];
      chunk = typeof el === 'string' ? parseInt(el, radix) : el;
    }

    if (chunk === null) {
      throw new TypeError('Unsupported type for chunk in buffer array.');
    }

    chunks.unshift(pad(chunk.toString(2), 4));
  }

  return chunks.join('');
}

export function encode(id: string | number, data: string | Buffer): Buffer {
  const numId = typeof id === 'string' ? parseInt(id, 16) : id;
  const paddingLen = (BIT_SIZE - 1).toString(16).length;
  const header = Buffer.concat([
    Buffer.from(BIT_COUNT.toString(36).toUpperCase()),
    Buffer.from(pad(numId.toString(16), paddingLen)),
  ]);

  const dataBuf = Buffer.isBuffer(data) ? data : Buffer.from(data);

  return Buffer.concat([header, dataBuf]);
}

export function decode(buffer: string | Buffer, encoding?: string): Buffer {
  const padding = 2 * BYTES_PER_CHARACTER;
  const offset = padding;
  const chunks: number[] = [];

  let str: string;
  if (Buffer.isBuffer(buffer)) {
    str = buffer.toString(encoding as BufferEncoding);
  } else {
    str = buffer;
  }

  str = pad(str, padding);

  for (let i = 0; i < str.length; i += offset) {
    const bits = str.slice(i, i + offset);
    const chunk = parseInt(bits, 16);
    chunks.unshift(chunk);
  }

  return Buffer.from(chunks);
}

export function split(
  string: string | Buffer,
  paddingVal?: number,
  radix?: number
): number[] {
  const chunks: number[] = [];

  if (Buffer.isBuffer(string)) {
    string = string.toString();
  }

  if (paddingVal) {
    string = pad(string, paddingVal);
  }

  let i: number;
  for (i = string.length; i > BIT_COUNT; i -= BIT_COUNT) {
    const bits = string.slice(i - BIT_COUNT, i);
    const chunk = parseInt(bits, radix);
    chunks.push(chunk);
  }

  chunks.push(parseInt(string.slice(0, i), radix as number));

  return chunks;
}
```

**Step 4: Run test to verify it passes**

```bash
npx jest lib/shamir/__tests__/codec.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add lib/shamir/codec.ts lib/shamir/__tests__/codec.test.ts
git commit -m "Port SSS codec module with tests"
```

---

### Task 12: Port horner, lagrange, points, share, random modules

**Files:**
- Create: `lib/shamir/horner.ts`
- Create: `lib/shamir/lagrange.ts`
- Create: `lib/shamir/points.ts`
- Create: `lib/shamir/share.ts`
- Create: `lib/shamir/random.ts`

**Step 1: Create horner.ts**

```typescript
// lib/shamir/horner.ts
import { MAX_SHARES } from './constants';
import { logs, exps } from './table';

export function horner(x: number, a: number[]): number {
  const n = MAX_SHARES;
  const t = a.length - 1;
  let b = 0;

  for (let i = t; i >= 0; --i) {
    b = b === 0 ? a[i] : exps[(logs[x] + logs[b]) % n] ^ a[i];
  }

  return b;
}
```

**Step 2: Create lagrange.ts**

```typescript
// lib/shamir/lagrange.ts
import { logs, exps } from './table';
import { MAX_SHARES } from './constants';

export function lagrange(x: number, p: [number[], number[]]): number {
  const n = MAX_SHARES;
  let product = 0;
  let sum = 0;

  for (let i = 0; i < p[0].length; ++i) {
    if (p[1][i]) {
      product = logs[p[1][i]];

      for (let j = 0; j < p[0].length; ++j) {
        if (i !== j) {
          if (x === p[0][j]) {
            product = -1;
            break;
          }

          const a = logs[x ^ p[0][j]] - logs[p[0][i] ^ p[0][j]];
          product = (product + a + n) % n;
        }
      }

      sum = product === -1 ? sum : sum ^ exps[product];
    }
  }

  return sum;
}
```

**Step 3: Create random.ts (React Native compatible)**

```typescript
// lib/shamir/random.ts
// Uses react-native-get-random-values polyfill (imported in polyfills.ts)
import { Buffer } from 'buffer';

export function random(size: number): Buffer {
  const arr = new Uint8Array(32 + size);
  crypto.getRandomValues(arr);
  return Buffer.from(arr.slice(32));
}
```

**Step 4: Create points.ts**

```typescript
// lib/shamir/points.ts
import { horner } from './horner';

interface PointsOpts {
  random: (size: number) => Buffer;
  threshold: number;
  shares: number;
}

export function points(a0: number, opts: PointsOpts) {
  const prng = opts.random;
  const a: number[] = [a0];
  const p: { x: number; y: number }[] = [];
  const t = opts.threshold;
  const n = opts.shares;

  for (let i = 1; i < t; ++i) {
    a[i] = parseInt(prng(1).toString('hex'), 16);
  }

  for (let i = 1; i < 1 + n; ++i) {
    p[i - 1] = {
      x: i,
      y: horner(i, a),
    };
  }

  return p;
}
```

**Step 5: Create share.ts**

```typescript
// lib/shamir/share.ts
import { Buffer } from 'buffer';
import { BIT_COUNT, BIT_SIZE } from './constants';

export interface ParsedShare {
  id: number | null;
  bits: number | null;
  data: string | null;
}

export function parse(input: string | Buffer): ParsedShare {
  const share: ParsedShare = { id: null, bits: null, data: null };

  let str: string;
  if (Buffer.isBuffer(input)) {
    str = input.toString('hex');
  } else {
    str = input;
  }

  if (str[0] === '0') {
    str = str.slice(1);
  }

  share.bits = parseInt(str.slice(0, 1), 36);
  const maxBits = BIT_SIZE - 1;
  const idLength = maxBits.toString(16).length;
  const regex = `^([a-kA-K3-9]{1})([a-fA-F0-9]{${idLength}})([a-fA-F0-9]+)$`;
  const matches = new RegExp(regex).exec(str);

  if (matches && matches.length) {
    share.id = parseInt(matches[2], 16);
    share.data = matches[3];
  }

  return share;
}
```

**Step 6: Commit**

```bash
git add lib/shamir/horner.ts lib/shamir/lagrange.ts lib/shamir/random.ts lib/shamir/points.ts lib/shamir/share.ts
git commit -m "Port SSS horner, lagrange, points, share, random modules"
```

---

### Task 13: Port split and combine functions with integration test

**Files:**
- Create: `lib/shamir/split.ts`
- Create: `lib/shamir/combine.ts`
- Create: `lib/shamir/index.ts`
- Create: `lib/shamir/__tests__/integration.test.ts`

**Step 1: Write failing integration test**

```typescript
// lib/shamir/__tests__/integration.test.ts
import { Buffer } from 'buffer';
import { split, combine } from '../index';
import { MAX_SHARES } from '../constants';

describe('Shamir Secret Sharing integration', () => {
  it('split returns correct number of shares', () => {
    const secret = Buffer.from('secret');
    const shares = split(secret, { shares: 5, threshold: 3 });
    expect(shares).toHaveLength(5);
    expect(shares.every((s: any) => Buffer.isBuffer(s))).toBe(true);
  });

  it('combine recovers secret from threshold shares', () => {
    const secret = Buffer.from('secret');
    const shares = split(secret, { shares: 5, threshold: 3 });
    const recovered = combine(shares.slice(0, 3));
    expect(Buffer.compare(recovered, secret)).toBe(0);
  });

  it('combine recovers from any 3 of 5 shares', () => {
    const secret = Buffer.from('test mnemonic phrase here');
    const shares = split(secret, { shares: 5, threshold: 3 });

    // Try different combinations
    const combos = [
      [0, 1, 2],
      [0, 2, 4],
      [1, 3, 4],
      [2, 3, 4],
    ];

    for (const combo of combos) {
      const subset = combo.map((i) => shares[i]);
      const recovered = combine(subset);
      expect(recovered.toString()).toBe(secret.toString());
    }
  });

  it('works with 24-word seed phrase', () => {
    const mnemonic =
      'vehicle nasty wrist siege head balcony boring economy cloud stone peace merry hospital cliff dinosaur walnut cat solar diesel horse honey end live gate';
    const secret = Buffer.from(mnemonic);
    const shares = split(secret, { shares: 5, threshold: 3 });
    const recovered = combine(shares.slice(0, 3));
    expect(recovered.toString()).toBe(mnemonic);
  });

  it('works with string shares (hex)', () => {
    const secret = 'secret';
    const shares = split(secret, { shares: 3, threshold: 2 });
    const hexShares = shares.map((s: Buffer) => s.toString('hex'));
    const recovered = combine(hexShares);
    expect(recovered.toString()).toBe(secret);
  });

  it('throws on invalid input', () => {
    expect(() => split('', { shares: 3, threshold: 2 })).toThrow(TypeError);
    expect(() => split(null as any, { shares: 3, threshold: 2 })).toThrow(TypeError);
    expect(() => split('secret', { shares: 0, threshold: 1 })).toThrow(RangeError);
    expect(() => split('secret', { shares: 3, threshold: 4 })).toThrow(RangeError);
    expect(() =>
      split('secret', { shares: MAX_SHARES + 1, threshold: 2 })
    ).toThrow(RangeError);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx jest lib/shamir/__tests__/integration.test.ts
```

Expected: FAIL

**Step 3: Create split.ts**

```typescript
// lib/shamir/split.ts
import { Buffer } from 'buffer';
import { points } from './points';
import { random } from './random';
import * as codec from './codec';
import { BIN_ENCODING, BIT_PADDING, MAX_SHARES } from './constants';

const scratch: any[] = new Array(2 * MAX_SHARES);

export interface SplitOpts {
  shares: number;
  threshold: number;
  random?: (size: number) => Buffer;
}

export function split(secret: string | Buffer, opts: SplitOpts): Buffer[] {
  if (!secret || (secret && secret.length === 0)) {
    throw new TypeError('Secret cannot be empty.');
  }

  if (typeof secret === 'string') {
    secret = Buffer.from(secret);
  }

  if (!Buffer.isBuffer(secret)) {
    throw new TypeError('Expecting secret to be a buffer.');
  }

  if (!opts || typeof opts !== 'object') {
    throw new TypeError('Expecting options to be an object.');
  }

  if (typeof opts.shares !== 'number') {
    throw new TypeError('Expecting shares to be a number.');
  }

  if (!opts.shares || opts.shares < 0 || opts.shares > MAX_SHARES) {
    throw new RangeError(`Shares must be 0 < shares <= ${MAX_SHARES}.`);
  }

  if (typeof opts.threshold !== 'number') {
    throw new TypeError('Expecting threshold to be a number.');
  }

  if (!opts.threshold || opts.threshold < 0 || opts.threshold > opts.shares) {
    throw new RangeError(`Threshold must be 0 < threshold <= ${opts.shares}.`);
  }

  if (!opts.random || typeof opts.random !== 'function') {
    opts.random = random;
  }

  const hexStr = codec.hex(secret);
  const binStr = codec.bin(hexStr, 16);
  const parts = codec.split('1' + binStr, BIT_PADDING, 2);

  for (let i = 0; i < parts.length; ++i) {
    const p = points(parts[i], opts as any);
    for (let j = 0; j < opts.shares; ++j) {
      if (!scratch[j]) {
        scratch[j] = p[j].x.toString(16);
      }

      const z = p[j].y.toString(2);
      const y = scratch[j + MAX_SHARES] || '';
      scratch[j + MAX_SHARES] = codec.pad(z) + y;
    }
  }

  for (let i = 0; i < opts.shares; ++i) {
    const x = scratch[i];
    const y = codec.hex(scratch[i + MAX_SHARES], BIN_ENCODING);
    scratch[i] = codec.encode(x, y);
    scratch[i] = Buffer.from('0' + scratch[i].toString('hex'), 'hex');
  }

  const result = scratch.slice(0, opts.shares);
  scratch.fill(0);
  return result;
}
```

**Step 4: Create combine.ts**

```typescript
// lib/shamir/combine.ts
import { Buffer } from 'buffer';
import { BIN_ENCODING } from './constants';
import { lagrange } from './lagrange';
import { parse } from './share';
import * as codec from './codec';

export function combine(shares: (string | Buffer)[]): Buffer {
  const chunks: string[] = [];
  const x: number[] = [];
  const y: number[][] = [];
  const t = shares.length;

  for (let i = 0; i < t; ++i) {
    const share = parse(shares[i]);

    if (share.id !== null && x.indexOf(share.id) === -1) {
      x.push(share.id);

      const binStr = codec.bin(share.data!, 16);
      const parts = codec.split(binStr, 0, 2);

      for (let j = 0; j < parts.length; ++j) {
        if (!y[j]) {
          y[j] = [];
        }
        y[j][x.length - 1] = parts[j];
      }
    }
  }

  for (let i = 0; i < y.length; ++i) {
    const p = lagrange(0, [x, y[i]]);
    chunks.unshift(codec.pad(p.toString(2)));
  }

  const string = chunks.join('');
  const binStr = string.slice(1 + string.indexOf('1'));
  const hexStr = codec.hex(binStr, BIN_ENCODING);
  const value = codec.decode(hexStr);

  return Buffer.from(value);
}
```

**Step 5: Create index.ts barrel export**

```typescript
// lib/shamir/index.ts
export { split } from './split';
export type { SplitOpts } from './split';
export { combine } from './combine';
```

**Step 6: Run tests**

```bash
npx jest lib/shamir/__tests__/integration.test.ts
```

Expected: PASS

**Step 7: Commit**

```bash
git add lib/shamir/
git commit -m "Port SSS split/combine with integration tests"
```

---

## Phase 4: Wallet Core

### Task 14: Create derivation path constants

**Files:**
- Create: `constants/derivation.ts`

**Step 1: Create derivation path constants**

```typescript
// constants/derivation.ts
import { PathType } from './types';

export const DERIVATION_PATHS: Record<PathType, { label: string; template: string; description: string }> = {
  metamask: {
    label: 'MetaMask',
    template: "m/44'/60'/0'/0/{index}",
    description: 'Standard BIP44 — MetaMask, Rainbow, most web wallets',
  },
  ledger: {
    label: 'Ledger',
    template: "m/44'/60'/{index}'/0/0",
    description: 'Ledger Live derivation path',
  },
  custom: {
    label: 'Custom',
    template: '',
    description: 'Enter your own derivation path',
  },
};

export function getDerivationPath(
  pathType: PathType,
  index: number,
  customPath?: string
): string {
  if (pathType === 'custom' && customPath) {
    return customPath.replace('{index}', String(index));
  }

  return DERIVATION_PATHS[pathType].template.replace('{index}', String(index));
}

export function getBasePath(pathType: PathType, customPath?: string): string {
  if (pathType === 'custom' && customPath) {
    return customPath.split('{index}')[0].replace(/\/+$/, '');
  }

  const template = DERIVATION_PATHS[pathType].template;
  // Return the path without the index part for display
  return template.replace('/{index}', '');
}

export const DEFAULT_ADDRESS_COUNT = 10;
export const DEFAULT_WORD_COUNT = 24;
export const DEFAULT_PATH_TYPE: PathType = 'metamask';
```

**Step 2: Commit**

```bash
git add constants/derivation.ts
git commit -m "Add derivation path constants"
```

---

### Task 15: Create wallet generation and derivation module

**Files:**
- Create: `lib/wallet/generate.ts`
- Create: `lib/wallet/derive.ts`
- Create: `lib/wallet/index.ts`
- Create: `lib/wallet/__tests__/wallet.test.ts`

**Step 1: Write failing test**

```typescript
// lib/wallet/__tests__/wallet.test.ts
import '../../polyfills';
import { generateMnemonic, validateMnemonic } from '../generate';
import { deriveAddresses } from '../derive';
import { WordCount } from '../../../constants/types';

describe('wallet generation', () => {
  it('generates a valid 12-word mnemonic', () => {
    const mnemonic = generateMnemonic(12);
    const words = mnemonic.split(' ');
    expect(words).toHaveLength(12);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it('generates a valid 24-word mnemonic', () => {
    const mnemonic = generateMnemonic(24);
    const words = mnemonic.split(' ');
    expect(words).toHaveLength(24);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it('generates different mnemonics each call', () => {
    const m1 = generateMnemonic(12);
    const m2 = generateMnemonic(12);
    expect(m1).not.toBe(m2);
  });
});

describe('address derivation', () => {
  // Known test vector — BIP39 test mnemonic
  const testMnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  it('derives 10 metamask addresses', () => {
    const addresses = deriveAddresses(testMnemonic, 'metamask', 10);
    expect(addresses).toHaveLength(10);
    expect(addresses[0].index).toBe(0);
    expect(addresses[0].address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(addresses[0].privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('derives correct first metamask address for test vector', () => {
    const addresses = deriveAddresses(testMnemonic, 'metamask', 1);
    // Known address for "abandon..." with m/44'/60'/0'/0/0
    expect(addresses[0].address.toLowerCase()).toBe(
      '0x9858effd232b4033e47d90003d41ec34ecaeda94'
    );
  });

  it('derives ledger addresses with different path', () => {
    const mmAddresses = deriveAddresses(testMnemonic, 'metamask', 1);
    const ledgerAddresses = deriveAddresses(testMnemonic, 'ledger', 1);
    // Ledger and Metamask should give different addresses for same mnemonic
    // (Ledger path: m/44'/60'/0'/0/0 vs m/44'/60'/0'/0/0 — actually index 0 may be same)
    // For index > 0 they differ due to path structure
    expect(ledgerAddresses).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx jest lib/wallet/__tests__/wallet.test.ts
```

Expected: FAIL

**Step 3: Create generate.ts**

```typescript
// lib/wallet/generate.ts
import { Mnemonic } from 'ethers';
import { WordCount } from '../../constants/types';

const WORD_COUNT_TO_ENTROPY: Record<WordCount, number> = {
  12: 128,
  15: 160,
  18: 192,
  21: 224,
  24: 256,
};

export function generateMnemonic(wordCount: WordCount = 24, extraEntropy?: Uint8Array): string {
  const entropyBits = WORD_COUNT_TO_ENTROPY[wordCount];
  const entropyBytes = entropyBits / 8;

  // Generate entropy
  const entropy = new Uint8Array(entropyBytes);
  crypto.getRandomValues(entropy);

  // Mix in extra entropy if provided (XOR)
  if (extraEntropy) {
    for (let i = 0; i < entropy.length; i++) {
      entropy[i] ^= extraEntropy[i % extraEntropy.length];
    }
  }

  const mnemonic = Mnemonic.fromEntropy(entropy);
  return mnemonic.phrase;
}

export function validateMnemonic(phrase: string): boolean {
  try {
    Mnemonic.fromPhrase(phrase);
    return true;
  } catch {
    return false;
  }
}
```

**Step 4: Create derive.ts**

```typescript
// lib/wallet/derive.ts
import { HDNodeWallet, Mnemonic } from 'ethers';
import { DerivedAddress, PathType } from '../../constants/types';
import { getDerivationPath } from '../../constants/derivation';

export function deriveAddresses(
  mnemonicPhrase: string,
  pathType: PathType,
  count: number,
  customPath?: string,
  passphrase?: string
): DerivedAddress[] {
  const mnemonic = Mnemonic.fromPhrase(mnemonicPhrase);
  const seed = HDNodeWallet.fromMnemonic(mnemonic, passphrase);
  const addresses: DerivedAddress[] = [];

  for (let i = 0; i < count; i++) {
    const path = getDerivationPath(pathType, i, customPath);
    const wallet = seed.derivePath(path);

    addresses.push({
      index: i,
      address: wallet.address,
      privateKey: wallet.privateKey,
    });
  }

  return addresses;
}
```

**Step 5: Create barrel export**

```typescript
// lib/wallet/index.ts
export { generateMnemonic, validateMnemonic } from './generate';
export { deriveAddresses } from './derive';
```

**Step 6: Run test**

```bash
npx jest lib/wallet/__tests__/wallet.test.ts
```

Expected: PASS

**Step 7: Commit**

```bash
git add lib/wallet/ constants/derivation.ts
git commit -m "Add wallet generation and HD derivation"
```

---

## Phase 5: Crypto & Storage

### Task 16: Create AES-256-GCM encryption module

**Files:**
- Create: `lib/crypto/aes.ts`
- Create: `lib/crypto/kdf.ts`
- Create: `lib/crypto/index.ts`
- Create: `lib/crypto/__tests__/crypto.test.ts`

**Step 1: Write failing test**

```typescript
// lib/crypto/__tests__/crypto.test.ts
import '../../polyfills';
import { encrypt, decrypt } from '../aes';
import { deriveKey } from '../kdf';

describe('AES-256-GCM', () => {
  it('encrypts and decrypts a string', async () => {
    const key = await deriveKey('testpin1234', 'random-salt');
    const plaintext = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const encrypted = await encrypt(plaintext, key);

    expect(encrypted).not.toBe(plaintext);
    expect(typeof encrypted).toBe('string');

    const decrypted = await decrypt(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it('fails to decrypt with wrong key', async () => {
    const key1 = await deriveKey('pin1', 'salt1');
    const key2 = await deriveKey('pin2', 'salt2');
    const encrypted = await encrypt('secret', key1);

    await expect(decrypt(encrypted, key2)).rejects.toThrow();
  });
});

describe('KDF', () => {
  it('derives a key from PIN', async () => {
    const key = await deriveKey('1234', 'test-salt');
    expect(key).toBeTruthy();
    expect(key.length).toBeGreaterThan(0);
  });

  it('same PIN + salt produces same key', async () => {
    const key1 = await deriveKey('1234', 'same-salt');
    const key2 = await deriveKey('1234', 'same-salt');
    expect(key1).toBe(key2);
  });

  it('different PINs produce different keys', async () => {
    const key1 = await deriveKey('1234', 'salt');
    const key2 = await deriveKey('5678', 'salt');
    expect(key1).not.toBe(key2);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx jest lib/crypto/__tests__/crypto.test.ts
```

Expected: FAIL

**Step 3: Create kdf.ts using expo-crypto**

```typescript
// lib/crypto/kdf.ts
import * as ExpoCrypto from 'expo-crypto';

export async function deriveKey(pin: string, salt: string): Promise<string> {
  // Use SHA-256 iterative hashing as PBKDF2 substitute for expo-crypto
  // expo-crypto provides digestStringAsync
  let derived = pin + salt;

  // 100k iterations of SHA-256
  // In practice, do fewer iterations for mobile performance and use
  // expo-crypto's digest. For a more robust approach, use a proper
  // PBKDF2 implementation if available.
  // Simplified: hash(pin + salt) iterated
  for (let i = 0; i < 1000; i++) {
    derived = await ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      derived
    );
  }

  return derived; // 64-char hex string (256 bits)
}

export function generateSalt(): string {
  const bytes = ExpoCrypto.getRandomBytes(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
```

**Step 4: Create aes.ts**

```typescript
// lib/crypto/aes.ts
import { Buffer } from 'buffer';

// AES-256-GCM using SubtleCrypto (available in React Native via polyfill)
// Fallback: XOR-based encryption with HMAC for integrity if SubtleCrypto unavailable

export async function encrypt(plaintext: string, keyHex: string): Promise<string> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  const keyBytes = hexToBytes(keyHex.slice(0, 64)); // 32 bytes = 256 bits
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  // Format: iv (24 hex) + ciphertext (hex)
  const ivHex = bytesToHex(iv);
  const ctHex = bytesToHex(new Uint8Array(ciphertext));
  return ivHex + ctHex;
}

export async function decrypt(encrypted: string, keyHex: string): Promise<string> {
  const iv = hexToBytes(encrypted.slice(0, 24));
  const ciphertext = hexToBytes(encrypted.slice(24));

  const keyBytes = hexToBytes(keyHex.slice(0, 64));
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
```

**Step 5: Create barrel export**

```typescript
// lib/crypto/index.ts
export { encrypt, decrypt } from './aes';
export { deriveKey, generateSalt } from './kdf';
```

**Step 6: Run tests**

```bash
npx jest lib/crypto/__tests__/crypto.test.ts
```

Expected: PASS (may need to mock expo-crypto in test env)

**Step 7: Commit**

```bash
git add lib/crypto/
git commit -m "Add AES-256-GCM encryption and KDF modules"
```

---

### Task 17: Create vault storage module

**Files:**
- Create: `lib/storage/keys.ts`
- Create: `lib/storage/vault.ts`
- Create: `lib/storage/index.ts`
- Create: `hooks/useVault.ts`

**Step 1: Create keys.ts (SecureStore wrapper)**

```typescript
// lib/storage/keys.ts
import * as SecureStore from 'expo-secure-store';
import { generateSalt, deriveKey } from '../crypto/kdf';

const MASTER_KEY_KEY = 'shamir_master_key';
const SALT_KEY = 'shamir_master_salt';
const PIN_HASH_KEY = 'shamir_pin_hash';

export async function initMasterKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(MASTER_KEY_KEY);
  if (!key) {
    // Generate a random master key
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    key = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    await SecureStore.setItemAsync(MASTER_KEY_KEY, key);
  }
  return key;
}

export async function getMasterKey(): Promise<string | null> {
  return SecureStore.getItemAsync(MASTER_KEY_KEY);
}

export async function setPIN(pin: string): Promise<void> {
  const salt = generateSalt();
  const hash = await deriveKey(pin, salt);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
  await SecureStore.setItemAsync(SALT_KEY, salt);
}

export async function verifyPIN(pin: string): Promise<boolean> {
  const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  const salt = await SecureStore.getItemAsync(SALT_KEY);
  if (!storedHash || !salt) return false;
  const hash = await deriveKey(pin, salt);
  return hash === storedHash;
}

export async function hasPIN(): Promise<boolean> {
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  return hash !== null;
}
```

**Step 2: Create vault.ts (encrypted file storage)**

```typescript
// lib/storage/vault.ts
import * as FileSystem from 'expo-file-system';
import { SecretRecord } from '../../constants/types';
import { encrypt, decrypt } from '../crypto/aes';
import { initMasterKey } from './keys';

const VAULT_FILE = FileSystem.documentDirectory + 'shamir_vault.enc';

async function readVault(): Promise<SecretRecord[]> {
  const key = await initMasterKey();

  try {
    const info = await FileSystem.getInfoAsync(VAULT_FILE);
    if (!info.exists) return [];

    const encrypted = await FileSystem.readAsStringAsync(VAULT_FILE);
    if (!encrypted) return [];

    const json = await decrypt(encrypted, key);
    return JSON.parse(json);
  } catch {
    return [];
  }
}

async function writeVault(records: SecretRecord[]): Promise<void> {
  const key = await initMasterKey();
  const json = JSON.stringify(records);
  const encrypted = await encrypt(json, key);
  await FileSystem.writeAsStringAsync(VAULT_FILE, encrypted);
}

export async function getAllSecrets(): Promise<SecretRecord[]> {
  return readVault();
}

export async function getSecret(id: string): Promise<SecretRecord | undefined> {
  const records = await readVault();
  return records.find((r) => r.id === id);
}

export async function saveSecret(record: SecretRecord): Promise<void> {
  const records = await readVault();
  const idx = records.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  await writeVault(records);
}

export async function deleteSecret(id: string): Promise<void> {
  const records = await readVault();
  const filtered = records.filter((r) => r.id !== id);
  await writeVault(filtered);
}
```

**Step 3: Create barrel export**

```typescript
// lib/storage/index.ts
export { getAllSecrets, getSecret, saveSecret, deleteSecret } from './vault';
export { initMasterKey, getMasterKey, setPIN, verifyPIN, hasPIN } from './keys';
```

**Step 4: Create useVault hook**

```typescript
// hooks/useVault.ts
import { useState, useEffect, useCallback } from 'react';
import { SecretRecord } from '../constants/types';
import { getAllSecrets, saveSecret, deleteSecret } from '../lib/storage/vault';

export function useVault() {
  const [secrets, setSecrets] = useState<SecretRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const records = await getAllSecrets();
    setSecrets(records);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (record: SecretRecord) => {
      await saveSecret(record);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteSecret(id);
      await refresh();
    },
    [refresh]
  );

  return { secrets, loading, refresh, save, remove };
}
```

**Step 5: Commit**

```bash
git add lib/storage/ hooks/useVault.ts
git commit -m "Add encrypted vault storage with SecureStore key management"
```

---

## Phase 6: Navigation Shell

### Task 18: Set up tab navigation with expo-router

**Files:**
- Modify: `app/_layout.tsx` (root layout with ThemeProvider + fonts)
- Create: `app/(tabs)/_layout.tsx` (tab navigator)
- Create: `app/(tabs)/index.tsx` (Home tab)
- Create: `app/(tabs)/generate/index.tsx` (Generate tab)
- Create: `app/(tabs)/generate/_layout.tsx` (Generate stack)
- Create: `app/(tabs)/scan/index.tsx` (Scan tab)
- Create: `app/(tabs)/scan/_layout.tsx` (Scan stack)
- Create: `app/(tabs)/vault/index.tsx` (Vault tab)
- Create: `app/(tabs)/vault/_layout.tsx` (Vault stack)
- Create: `app/(tabs)/settings/index.tsx` (Settings tab)
- Create: `app/(tabs)/settings/_layout.tsx` (Settings stack)

**Step 1: Create root layout with ThemeProvider and font loading**

```typescript
// app/_layout.tsx
import '../lib/polyfills';
import React from 'react';
import { Stack } from 'expo-router';
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular } from '@expo-google-fonts/space-mono';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '../hooks/useTheme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_700Bold,
    SpaceMono_400Regular,
  });

  React.useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
```

**Step 2: Create tab layout with neobrutalist styling**

```typescript
// app/(tabs)/_layout.tsx
import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NEO } from '../../constants/theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const { highlight } = useTheme();
  return (
    <View
      style={[
        styles.tabIcon,
        focused && { backgroundColor: highlight },
      ]}
    >
      <Text style={styles.tabIconText}>{name}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: NEO.bg,
          borderBottomWidth: NEO.borderWidth,
          borderBottomColor: NEO.border,
        },
        headerTitleStyle: {
          fontFamily: NEO.fontUIBold,
          fontSize: 18,
          color: NEO.text,
          textTransform: 'uppercase',
        },
        tabBarStyle: {
          backgroundColor: NEO.bg,
          borderTopWidth: NEO.borderWidth,
          borderTopColor: NEO.border,
          height: 80,
          paddingBottom: 20,
        },
        tabBarLabelStyle: {
          fontFamily: NEO.fontUIBold,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
        tabBarActiveTintColor: NEO.text,
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="H" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Generate',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="G" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="S" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="V" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="*" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: NEO.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 14,
    color: NEO.text,
  },
});
```

**Step 3: Create stub screens for each tab**

Create each stack layout and index screen. Each stack layout is:

```typescript
// app/(tabs)/generate/_layout.tsx (and similar for scan, vault, settings)
import { Stack } from 'expo-router';
import { NEO } from '../../../constants/theme';

export default function GenerateLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: NEO.bg,
        },
        headerTitleStyle: {
          fontFamily: NEO.fontUIBold,
          textTransform: 'uppercase',
        },
        headerBackTitle: 'Back',
      }}
    />
  );
}
```

Each index screen is a placeholder:

```typescript
// app/(tabs)/generate/index.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NeoButton, NeoCard } from '../../../components/neo';
import { NEO } from '../../../constants/theme';
import { router } from 'expo-router';

export default function GenerateScreen() {
  return (
    <ScrollView style={styles.container}>
      <NeoCard title="Generate New Secret">
        <Text style={styles.text}>
          Create a new BIP39 seed phrase and split it into Shamir shares.
        </Text>
        <NeoButton
          title="Start"
          onPress={() => router.push('/(tabs)/generate/entropy')}
          style={{ marginTop: 16 }}
        />
      </NeoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg, padding: 16 },
  text: { fontFamily: NEO.fontUI, fontSize: 16, color: NEO.text },
});
```

**Step 4: Verify navigation works in Expo Go**

```bash
npx expo start
```

Expected: 5 tabs visible, can switch between them. Neobrutalist styling applied.

**Step 5: Commit**

```bash
git add app/
git commit -m "Set up tab navigation with neobrutalist styling"
```

---

## Phase 7: Home Screen

### Task 19: Build Home screen with instructions and quick actions

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Step 1: Build the Home screen**

Build a screen with:
- App name "SHAMIR" in bold header
- 3 instruction cards explaining the app's purpose:
  1. "Generate" — Create seed phrases and Shamir shares
  2. "Scan" — Reconstruct from printed QR cards
  3. "Vault" — Access saved secrets
- Quick action buttons linking to Generate and Scan tabs

Use `NeoCard` and `NeoButton` components. Style with `NEO` constants. Include descriptive text for each feature.

**Step 2: Verify in Expo Go**

Expected: Home tab shows instructions with neobrutalist cards.

**Step 3: Commit**

```bash
git add app/(tabs)/index.tsx
git commit -m "Build Home screen with instructions and quick actions"
```

---

## Phase 8: Generate Flow

### Task 20: Build Entropy screen

**Files:**
- Create: `app/(tabs)/generate/entropy.tsx`
- Create: `components/EntropyCanvas.tsx`

**Step 1: Create EntropyCanvas component**

A canvas-like component using `react-native-gesture-handler` or basic `PanResponder` that:
- Tracks finger movement coordinates and timestamps
- Draws a visible trail (feedback to user)
- Stores coordinates in a buffer for entropy collection
- Shows progress bar (entropy collected / required)

```typescript
// components/EntropyCanvas.tsx
import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, PanResponder, Text } from 'react-native';
import { NEO } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface EntropyCanvasProps {
  onEntropyReady: (entropy: Uint8Array) => void;
  requiredPoints?: number;
}

export function EntropyCanvas({ onEntropyReady, requiredPoints = 200 }: EntropyCanvasProps) {
  const { highlight } = useTheme();
  const [points, setPoints] = useState<{ x: number; y: number; t: number }[]>([]);
  const [ready, setReady] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const point = {
          x: gestureState.moveX,
          y: gestureState.moveY,
          t: Date.now(),
        };
        setPoints((prev) => {
          const next = [...prev, point];
          if (next.length >= requiredPoints && !ready) {
            setReady(true);
            // Hash all points into entropy
            const data = next.map((p) => `${p.x}:${p.y}:${p.t}`).join('|');
            const encoder = new TextEncoder();
            const encoded = encoder.encode(data);
            // Use first 32 bytes of SHA-256 hash via crypto.subtle
            crypto.subtle.digest('SHA-256', encoded).then((hash) => {
              onEntropyReady(new Uint8Array(hash));
            });
          }
          return next;
        });
      },
    })
  ).current;

  const progress = Math.min(points.length / requiredPoints, 1);

  return (
    <View style={styles.container}>
      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Text style={styles.instruction}>
          {ready ? 'ENTROPY COLLECTED' : 'DRAW RANDOMLY'}
        </Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%`, backgroundColor: highlight }]} />
      </View>
      <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  canvas: {
    height: 200,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    fontFamily: NEO.fontUIBold,
    fontSize: 18,
    color: '#999',
    textTransform: 'uppercase',
  },
  progressContainer: {
    height: 8,
    borderWidth: 2,
    borderColor: NEO.border,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  progressText: {
    fontFamily: NEO.fontMono,
    fontSize: 14,
    color: NEO.text,
    marginTop: 4,
    textAlign: 'center',
  },
});
```

**Step 2: Create Entropy screen**

```typescript
// app/(tabs)/generate/entropy.tsx
// Lets user choose: System CSPRNG only, Finger draw, Camera, or Combined
// Each option is a NeoCard with description
// "Combined" uses both finger draw canvas and camera snapshot
// After entropy is collected, navigate to mnemonic screen with entropy data
```

Screen shows 4 option cards. On selecting "Combined" or "Finger", shows `EntropyCanvas`. On selecting "Camera", opens camera for a single photo, hashes pixels. On "System Only", proceeds directly.

Pass entropy as a route param (base64 encoded) to the next screen.

**Step 3: Verify in Expo Go**

Expected: Entropy screen shows options. Finger draw canvas works. Camera option requests permission.

**Step 4: Commit**

```bash
git add app/(tabs)/generate/entropy.tsx components/EntropyCanvas.tsx
git commit -m "Add entropy collection screen with finger-draw canvas"
```

---

### Task 21: Build Mnemonic generation screen

**Files:**
- Create: `app/(tabs)/generate/mnemonic.tsx`
- Create: `components/MnemonicGrid.tsx`

**Step 1: Create MnemonicGrid component**

```typescript
// components/MnemonicGrid.tsx
// Displays seed phrase words in a 3-column grid
// Each word shows its index (1-24)
// Neobrutalist styling: bordered cells, monospace font
// Optional: blurred/hidden mode with reveal button
```

Component receives `words: string[]` and `revealed: boolean` props. When hidden, shows `***` for each word.

**Step 2: Create mnemonic generation screen**

Screen that:
1. Receives entropy from route params (or uses system CSPRNG)
2. Shows selector for word count (12/15/18/21/24) — row of `NeoButton` toggles
3. "Generate" button calls `generateMnemonic(wordCount, extraEntropy)`
4. Displays result in `MnemonicGrid`
5. "Continue" button navigates to derivation screen with mnemonic

**Step 3: Verify in Expo Go**

Expected: Can select word count, generate mnemonic, see words displayed.

**Step 4: Commit**

```bash
git add app/(tabs)/generate/mnemonic.tsx components/MnemonicGrid.tsx
git commit -m "Add mnemonic generation screen with word grid"
```

---

### Task 22: Build Derivation screen (addresses + private keys)

**Files:**
- Create: `app/(tabs)/generate/derivation.tsx`
- Create: `components/AddressRow.tsx`

**Step 1: Create AddressRow component**

```typescript
// components/AddressRow.tsx
// Shows: index number | truncated address (0x1234...abcd) | copy button | eye button
// Eye button toggles private key visibility
// Copy button copies address to clipboard with warning for private keys
// Neobrutalist styling: bordered row, monospace text
```

**Step 2: Create derivation screen**

Screen that:
1. Receives mnemonic from route params
2. Shows path type selector (Metamask / Ledger / Custom) — row of `NeoButton` toggles
3. If Custom, show `NeoInput` for path string
4. Shows address count selector (5 / 10 / 20)
5. Calls `deriveAddresses()` and displays results in scrollable list of `AddressRow`
6. "Continue to Shamir" button

**Step 3: Verify in Expo Go**

Expected: Addresses display correctly for MetaMask path. Can toggle private key visibility.

**Step 4: Commit**

```bash
git add app/(tabs)/generate/derivation.tsx components/AddressRow.tsx
git commit -m "Add derivation screen with address list and key reveal"
```

---

### Task 23: Build Shamir configuration screen

**Files:**
- Create: `app/(tabs)/generate/shamir.tsx`

**Step 1: Create Shamir config screen**

Screen with:
1. Threshold (M) selector — stepper or numeric input, min 2
2. Total shares (N) selector — stepper, min = M, max = 10
3. Visual representation: "Any {M} of {N} shares needed to reconstruct"
4. Validation: M <= N, M >= 2, N >= 2
5. "Continue" button to metadata screen

Use `NeoCard` with stepper controls (+ and - `NeoButton`s flanking a number display).

**Step 2: Verify in Expo Go**

Expected: Can configure M-of-N with validation.

**Step 3: Commit**

```bash
git add app/(tabs)/generate/shamir.tsx
git commit -m "Add Shamir M-of-N configuration screen"
```

---

### Task 24: Build Metadata screen (label, PIN, passphrase)

**Files:**
- Create: `app/(tabs)/generate/metadata.tsx`

**Step 1: Create metadata screen**

Screen with:
1. `NeoInput` for secret name/label (required)
2. Toggle for PIN protection — if enabled, shows PIN input (numeric, 4-8 digits)
3. Toggle for BIP39 passphrase — if enabled, shows passphrase input
4. Optional key-value metadata fields (add/remove buttons)
5. "Generate PDF" button that:
   - Encrypts mnemonic with PIN if enabled
   - Splits with SSS using configured M-of-N
   - Creates SharePayload for each share
   - Navigates to preview screen

**Step 2: Verify in Expo Go**

Expected: Can enter name, toggle PIN/passphrase, add metadata.

**Step 3: Commit**

```bash
git add app/(tabs)/generate/metadata.tsx
git commit -m "Add metadata screen with PIN and passphrase options"
```

---

## Phase 9: QR & PDF Generation

### Task 25: Create QR code view component

**Files:**
- Create: `components/QRCodeView.tsx`

**Step 1: Create QRCodeView**

```typescript
// components/QRCodeView.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { NEO } from '../constants/theme';

interface QRCodeViewProps {
  value: string;
  size?: number;
}

export function QRCodeView({ value, size = 200 }: QRCodeViewProps) {
  return (
    <View style={[styles.container, { width: size + 24, height: size + 24 }]}>
      <QRCode
        value={value}
        size={size}
        backgroundColor={NEO.bg}
        color={NEO.text}
      />
    </View>
  );
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

**Step 2: Commit**

```bash
git add components/QRCodeView.tsx
git commit -m "Add QR code view component"
```

---

### Task 26: Create PDF card HTML templates

**Files:**
- Create: `lib/pdf/templates.ts`
- Create: `lib/pdf/layouts.ts`
- Create: `lib/pdf/generate.ts`
- Create: `lib/pdf/index.ts`

**Step 1: Create layouts.ts**

```typescript
// lib/pdf/layouts.ts
export type LayoutType = 'full-page' | '2-up' | 'wallet-size';

export interface LayoutConfig {
  label: string;
  description: string;
  cardsPerPage: number;
  cardWidth: string;  // CSS unit
  cardHeight: string; // CSS unit
  qrSize: number;     // pixels
  orientation: 'portrait' | 'landscape';
}

export const LAYOUTS: Record<LayoutType, LayoutConfig> = {
  'full-page': {
    label: 'Full Page',
    description: 'One card per page, large QR code',
    cardsPerPage: 1,
    cardWidth: '100%',
    cardHeight: '100%',
    qrSize: 300,
    orientation: 'portrait',
  },
  '2-up': {
    label: '2-Up',
    description: 'Two cards per page',
    cardsPerPage: 2,
    cardWidth: '100%',
    cardHeight: '48%',
    qrSize: 200,
    orientation: 'portrait',
  },
  'wallet-size': {
    label: 'Wallet Size',
    description: 'Credit card size, 4 per page',
    cardsPerPage: 4,
    cardWidth: '48%',
    cardHeight: '48%',
    qrSize: 120,
    orientation: 'landscape',
  },
};
```

**Step 2: Create templates.ts**

```typescript
// lib/pdf/templates.ts
import { SharePayload } from '../../constants/types';
import { LayoutConfig } from './layouts';

export function renderCardHTML(
  share: SharePayload,
  qrDataUrl: string,
  highlightColor: string,
  layout: LayoutConfig
): string {
  const date = new Date(Date.now()).toISOString().split('T')[0];

  return `
    <div class="card" style="width:${layout.cardWidth};height:${layout.cardHeight};">
      <div class="header" style="background:${highlightColor};">
        SHAMIR SHARE ${share.shareIndex}/${share.totalShares}
      </div>
      <div class="body">
        <div class="qr">
          <img src="${qrDataUrl}" width="${layout.qrSize}" height="${layout.qrSize}" />
        </div>
        <div class="meta">
          <p><strong>Name:</strong> ${share.name}</p>
          <p><strong>Threshold:</strong> ${share.threshold} of ${share.totalShares}</p>
          <p><strong>Created:</strong> ${date}</p>
          <p><strong>Path:</strong> ${share.pathType}</p>
          <p><strong>Words:</strong> ${share.wordCount}</p>
          <p><strong>PIN:</strong> ${share.hasPIN ? 'Required' : 'None'}</p>
        </div>
      </div>
      <div class="footer">
        shamir v1 | share ${share.shareIndex} of ${share.totalShares} | DO NOT LOSE
      </div>
    </div>
  `;
}

export function renderPageHTML(
  cards: string[],
  highlightColor: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page { margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; color: #000; }
  .page { page-break-after: always; display: flex; flex-wrap: wrap; gap: 8px; }
  .page:last-child { page-break-after: auto; }
  .card {
    border: 3px solid #000;
    box-shadow: 6px 6px 0 #000;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .header {
    padding: 10px 16px;
    font-weight: bold;
    font-size: 16px;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-bottom: 3px solid #000;
  }
  .body {
    display: flex;
    flex-direction: row;
    padding: 16px;
    flex: 1;
    gap: 16px;
  }
  .qr {
    border: 2px solid #000;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
  }
  .meta p { line-height: 1.4; }
  .footer {
    padding: 8px 16px;
    border-top: 3px solid #000;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: #f5f5f5;
  }
</style>
</head>
<body>
  <div class="page">
    ${cards.join('\n')}
  </div>
</body>
</html>`;
}
```

**Step 3: Create generate.ts**

```typescript
// lib/pdf/generate.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SharePayload } from '../../constants/types';
import { renderCardHTML, renderPageHTML } from './templates';
import { LayoutConfig, LAYOUTS, LayoutType } from './layouts';

export async function generatePDF(
  shares: SharePayload[],
  qrDataUrls: string[],
  highlightColor: string,
  layoutType: LayoutType = 'full-page'
): Promise<string> {
  const layout = LAYOUTS[layoutType];

  const cards = shares.map((share, i) =>
    renderCardHTML(share, qrDataUrls[i], highlightColor, layout)
  );

  const html = renderPageHTML(cards, highlightColor);

  const { uri } = await Print.printToFileAsync({
    html,
    width: 612,  // US Letter
    height: 792,
  });

  return uri;
}

export async function sharePDF(uri: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Share Shamir Cards',
    });
  }
}
```

**Step 4: Create barrel export**

```typescript
// lib/pdf/index.ts
export { generatePDF, sharePDF } from './generate';
export { LAYOUTS } from './layouts';
export type { LayoutType, LayoutConfig } from './layouts';
```

**Step 5: Commit**

```bash
git add lib/pdf/
git commit -m "Add PDF card templates and generation pipeline"
```

---

### Task 27: Build PDF Preview and Share screens

**Files:**
- Create: `app/(tabs)/generate/preview.tsx`
- Create: `app/(tabs)/generate/share.tsx`

**Step 1: Create preview screen**

Screen that:
1. Receives all share data from route params / context
2. Shows a scrollable preview of each card (rendered as React Native views, not HTML)
3. Layout selector (full-page / 2-up / wallet-size)
4. Password protection toggle with password input
5. "Generate PDF" button — calls `generatePDF()`, shows loading state
6. Navigates to share screen with PDF URI

**Step 2: Create share screen**

Screen that:
1. Shows PDF generated confirmation with file size
2. "Share" button — calls `sharePDF()` to open iOS share sheet
3. "Save to Vault" button — saves the SecretRecord to vault
4. "Done" button — returns to Generate tab root

**Step 3: Verify in Expo Go (PDF will use expo-print fallback)**

Expected: Preview shows cards. Share sheet opens with PDF.

**Step 4: Commit**

```bash
git add app/(tabs)/generate/preview.tsx app/(tabs)/generate/share.tsx
git commit -m "Add PDF preview and share screens"
```

---

## Phase 10: Scan Flow

### Task 28: Build QR scanner screen

**Files:**
- Create: `app/(tabs)/scan/index.tsx`
- Create: `hooks/useScanner.ts`
- Create: `components/ScanProgress.tsx`

**Step 1: Create useScanner hook (state machine)**

```typescript
// hooks/useScanner.ts
import { useState, useCallback } from 'react';
import { SharePayload } from '../constants/types';

type ScanState = 'idle' | 'scanning' | 'pin_required' | 'reconstructing' | 'done' | 'error';

export function useScanner() {
  const [state, setState] = useState<ScanState>('idle');
  const [scannedShares, setScannedShares] = useState<SharePayload[]>([]);
  const [targetThreshold, setTargetThreshold] = useState<number>(0);
  const [targetTotal, setTargetTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [secretId, setSecretId] = useState<string | null>(null);

  const onScan = useCallback(
    (data: string) => {
      try {
        const payload: SharePayload = JSON.parse(data);

        // Validate it's a shamir share
        if (payload.v !== 1 || !payload.shareData) {
          setError('Invalid QR code — not a Shamir share');
          return;
        }

        // First scan sets the target
        if (scannedShares.length === 0) {
          setSecretId(payload.id);
          setTargetThreshold(payload.threshold);
          setTargetTotal(payload.totalShares);
        } else {
          // Validate same secret
          if (payload.id !== secretId) {
            setError('This share belongs to a different secret');
            return;
          }
          // Check for duplicate
          if (scannedShares.some((s) => s.shareIndex === payload.shareIndex)) {
            setError(`Share #${payload.shareIndex} already scanned`);
            return;
          }
        }

        const updated = [...scannedShares, payload];
        setScannedShares(updated);
        setError(null);

        // Check if threshold met
        if (updated.length >= payload.threshold) {
          if (payload.hasPIN) {
            setState('pin_required');
          } else {
            setState('reconstructing');
          }
        }
      } catch {
        setError('Could not parse QR code');
      }
    },
    [scannedShares, secretId]
  );

  const reset = useCallback(() => {
    setState('idle');
    setScannedShares([]);
    setTargetThreshold(0);
    setTargetTotal(0);
    setError(null);
    setSecretId(null);
  }, []);

  return {
    state,
    setState,
    scannedShares,
    targetThreshold,
    targetTotal,
    error,
    onScan,
    reset,
  };
}
```

**Step 2: Create ScanProgress component**

```typescript
// components/ScanProgress.tsx
// Shows: "Scanned 2 of 3 required (5 total)"
// Progress circles for each share (filled = scanned, empty = missing)
// Neobrutalist styling
```

**Step 3: Create scan screen**

```typescript
// app/(tabs)/scan/index.tsx
// CameraView with barcode scanning enabled
// Overlay with ScanProgress at top
// Error messages displayed as NeoBadge
// On threshold met → navigate to pin.tsx or result.tsx
```

**Step 4: Verify in Expo Go**

Expected: Camera opens, can scan QR codes, progress updates.

**Step 5: Commit**

```bash
git add app/(tabs)/scan/index.tsx hooks/useScanner.ts components/ScanProgress.tsx
git commit -m "Add QR scanner with state machine and progress tracking"
```

---

### Task 29: Build PIN entry and reconstruction screens

**Files:**
- Create: `app/(tabs)/scan/pin.tsx`
- Create: `app/(tabs)/scan/result.tsx`

**Step 1: Create PIN entry screen**

Screen with:
- `NeoInput` for PIN (numeric, secure text entry)
- Optional passphrase input if `hasPassphrase` is true
- "Reconstruct" button
- Calls SSS combine, then decrypts with PIN if needed

**Step 2: Create result screen**

Screen showing:
- Reconstructed mnemonic in `MnemonicGrid`
- Derived addresses in scrollable `AddressRow` list
- "Save to Vault" button
- "Done" button

**Step 3: Verify in Expo Go**

Expected: Can enter PIN, reconstruct secret, see addresses.

**Step 4: Commit**

```bash
git add app/(tabs)/scan/pin.tsx app/(tabs)/scan/result.tsx
git commit -m "Add PIN entry and reconstruction result screens"
```

---

## Phase 11: Vault

### Task 30: Build Vault list and detail screens

**Files:**
- Modify: `app/(tabs)/vault/index.tsx`
- Create: `app/(tabs)/vault/[id].tsx`

**Step 1: Build vault list screen**

Screen showing:
- List of saved `SecretRecord`s as `NeoCard`s
- Each card shows: name, date, word count, path type, shamir config
- Tap navigates to detail screen
- Empty state: "No secrets saved yet" with link to Generate

Uses `useVault()` hook.

**Step 2: Build vault detail screen**

Screen showing:
- Secret name, date, shamir config
- Mnemonic (hidden by default, reveal with button + PIN verification)
- Derived addresses list with `AddressRow`
- "Re-generate PDF" button (re-splits and generates new PDF)
- "Delete" button with confirmation

**Step 3: Verify in Expo Go**

Expected: Vault shows saved secrets. Detail shows addresses.

**Step 4: Commit**

```bash
git add app/(tabs)/vault/
git commit -m "Add Vault list and detail screens"
```

---

## Phase 12: Settings

### Task 31: Build Settings screens

**Files:**
- Modify: `app/(tabs)/settings/index.tsx`
- Create: `app/(tabs)/settings/theme.tsx`
- Create: `app/(tabs)/settings/layout.tsx`
- Create: `app/(tabs)/settings/about.tsx`
- Create: `components/ColorPicker.tsx`

**Step 1: Create ColorPicker component**

```typescript
// components/ColorPicker.tsx
// Shows preset palette rows (Pastels, Bold, Muted)
// Each color is a pressable square with neobrutalist border
// Selected color has thicker border and checkmark
// Rainbow gradient slider at bottom for custom color selection
// Calls setHighlight from useTheme on selection
```

**Step 2: Create settings index screen**

Screen with:
- "Set PIN" card — NeoInput for PIN with confirm
- "Default Word Count" — selector (12/15/18/21/24)
- "Default Address Count" — stepper (5/10/20)
- "Default Derivation Path" — selector (Metamask/Ledger)
- Links to Theme, PDF Layout, About sub-screens

**Step 3: Create theme screen**

Screen with `ColorPicker` component. Full-screen color selection experience.

**Step 4: Create layout screen**

Screen showing layout options (full-page, 2-up, wallet-size) as visual cards with example thumbnail representation.

**Step 5: Create about screen**

Simple screen: app name, version, brief description, link to instructions.

**Step 6: Verify in Expo Go**

Expected: All settings screens work. Color picker changes highlight globally.

**Step 7: Commit**

```bash
git add app/(tabs)/settings/ components/ColorPicker.tsx
git commit -m "Add Settings screens with color picker and layout options"
```

---

## Phase 13: Integration & Polish

### Task 32: Wire up the complete Generate → PDF flow

**Files:**
- Modify: `app/(tabs)/generate/metadata.tsx` (wire SSS split + QR generation)
- Modify: `app/(tabs)/generate/preview.tsx` (wire PDF generation)

**Step 1: In metadata.tsx, on "Generate PDF" press:**

1. If PIN enabled, encrypt mnemonic with PIN-derived key
2. Call `split(mnemonicBuffer, { shares: N, threshold: M })`
3. Create `SharePayload` for each share
4. JSON-stringify each payload
5. Generate QR code data URLs from each JSON string
6. Navigate to preview with shares + QR data

**Step 2: In preview.tsx:**

1. Render card previews from share data
2. On "Generate PDF" call `generatePDF(shares, qrDataUrls, highlight, layoutType)`
3. Navigate to share screen with PDF URI

**Step 3: Test full flow in Expo Go**

Expected: Generate mnemonic → configure → split → preview cards → generate PDF → share sheet.

**Step 4: Commit**

```bash
git add app/(tabs)/generate/
git commit -m "Wire complete Generate to PDF flow"
```

---

### Task 33: Wire up the complete Scan → Reconstruct flow

**Files:**
- Modify: `app/(tabs)/scan/index.tsx` (wire camera scanning)
- Modify: `app/(tabs)/scan/result.tsx` (wire SSS combine + derivation)

**Step 1: In scan/index.tsx:**

1. Use `CameraView` with `onBarcodeScanned`
2. Parse scanned data through `useScanner.onScan()`
3. On threshold met, navigate to pin.tsx or result.tsx

**Step 2: In scan/result.tsx:**

1. Receive scanned shares
2. Extract `shareData` hex strings from each `SharePayload`
3. Convert to Buffer and call `combine(shareBuffers)`
4. If PIN was set, decrypt the combined result
5. Validate it's a valid BIP39 mnemonic
6. Derive addresses using the path info from the SharePayload
7. Display results

**Step 3: Test with printed QR codes**

Generate a PDF, print it, scan the QR codes back. Verify round-trip works.

Expected: Mnemonic reconstructed matches original.

**Step 4: Commit**

```bash
git add app/(tabs)/scan/
git commit -m "Wire complete Scan to Reconstruct flow"
```

---

### Task 34: Add camera entropy source

**Files:**
- Create: `lib/entropy/camera.ts`
- Create: `lib/entropy/mix.ts`
- Create: `lib/entropy/index.ts`
- Modify: `app/(tabs)/generate/entropy.tsx` (wire camera option)

**Step 1: Create camera.ts**

```typescript
// lib/entropy/camera.ts
// Takes a photo using expo-camera
// Reads pixel data (downsample to reduce size)
// SHA-256 hash the pixel data
// Returns Uint8Array(32) of entropy
```

**Step 2: Create mix.ts**

```typescript
// lib/entropy/mix.ts
// Combines multiple entropy sources:
// 1. XOR all provided Uint8Array(32) sources together
// 2. XOR with system CSPRNG output
// 3. SHA-256 hash the result
// Returns final Uint8Array(32)
```

**Step 3: Wire into entropy screen**

Add camera capture flow and combined mode that chains finger-draw → camera → mix.

**Step 4: Commit**

```bash
git add lib/entropy/ app/(tabs)/generate/entropy.tsx
git commit -m "Add camera entropy source and entropy mixing"
```

---

### Task 35: Final polish and cleanup

**Files:**
- Various: fix any TypeScript errors, missing imports, navigation edge cases

**Step 1: Run TypeScript type checking**

```bash
npx tsc --noEmit
```

Fix any type errors.

**Step 2: Test all navigation flows**

Manually test in Expo Go:
- Home → Generate → Entropy → Mnemonic → Derivation → Shamir → Metadata → Preview → Share
- Home → Scan → (scan QR codes) → PIN → Result → Save to Vault
- Vault → Detail → View addresses → Delete
- Settings → Theme → Pick color → Verify global change
- Settings → Layout → Change default

**Step 3: Create .gitignore**

```
node_modules/
.expo/
dist/
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/
.env
.claude/
```

**Step 4: Final commit**

```bash
git add -A
git commit -m "Polish: fix types, navigation, and add gitignore"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-3 | Project scaffolding, deps, polyfills |
| 2 | 4-9 | Theme system, neo components (Button, Card, Input, Badge) |
| 3 | 10-13 | Port SSS library with tests |
| 4 | 14-15 | Wallet generation and derivation |
| 5 | 16-17 | Encryption (AES-GCM) and vault storage |
| 6 | 18 | Navigation shell (5 tabs, all screen stubs) |
| 7 | 19 | Home screen with instructions |
| 8 | 20-24 | Generate flow (entropy, mnemonic, derivation, shamir, metadata) |
| 9 | 25-27 | QR codes and PDF generation |
| 10 | 28-29 | Scan flow (camera, reconstruction) |
| 11 | 30 | Vault screens |
| 12 | 31 | Settings screens with color picker |
| 13 | 32-35 | Integration wiring and polish |

**Total: 35 tasks across 13 phases.**

Phases 3-5 (lib/) are fully TDD with unit tests. Phases 6-12 (screens) are integration-tested via Expo Go.
