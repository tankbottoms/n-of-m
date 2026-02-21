import { Buffer } from 'buffer';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Mock expo-crypto before importing shamir (it uses expo-crypto for random)
jest.mock('expo-crypto', () => ({
  getRandomBytes: (size: number) => {
    return new Uint8Array(crypto.randomBytes(size));
  },
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digestStringAsync: async (algorithm: string, data: string) => {
    const nodeAlg = algorithm === 'SHA-256' ? 'sha256' : 'sha512';
    return crypto.createHash(nodeAlg).update(data).digest('hex');
  },
}));

import { split, combine } from '../index';
import { encrypt } from '../../crypto/aes';
import { deriveKey } from '../../crypto/kdf';

const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('Generate E2E test fixtures', () => {
  it('generates share payloads and writes fixture file', () => {
    const SECRET_ID = 'test-e2e-001';
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

    const fixture = {
      mnemonic: TEST_MNEMONIC,
      threshold: THRESHOLD,
      totalShares: TOTAL_SHARES,
      shares: payloads,
    };

    const outPath = path.resolve(__dirname, '../../../.maestro/fixtures/test-shares.json');
    fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2));

    // Verify the shares can be recombined
    const hexShares = shares.map((s) => s.toString('hex'));
    const recovered = combine([hexShares[0], hexShares[1]]);
    expect(recovered.toString()).toBe(TEST_MNEMONIC);

    console.log('Fixture written to:', outPath);
  });
});

describe('Generate PIN-protected test fixtures', () => {
  it('generates PIN-protected share payloads', async () => {
    const PIN = '1234';
    const SALT = crypto.randomBytes(16).toString('hex');
    const key = await deriveKey(PIN, SALT);
    const encryptedMnemonic = await encrypt(TEST_MNEMONIC, key);

    const SECRET_ID = 'test-e2e-pin-001';
    const THRESHOLD = 2;
    const TOTAL_SHARES = 3;

    const secretBuffer = Buffer.from(encryptedMnemonic);
    const shares = split(secretBuffer, { shares: TOTAL_SHARES, threshold: THRESHOLD });

    const payloads = shares.map((shareBuf, i) => ({
      v: 1,
      id: SECRET_ID,
      name: 'E2E PIN Test',
      shareIndex: i + 1,
      totalShares: TOTAL_SHARES,
      threshold: THRESHOLD,
      shareData: shareBuf.toString('hex'),
      derivationPath: "m/44'/60'/0'/0",
      pathType: 'metamask',
      wordCount: 12,
      hasPIN: true,
      hasPassphrase: false,
    }));

    const fixture = {
      mnemonic: TEST_MNEMONIC,
      pin: PIN,
      salt: SALT,
      threshold: THRESHOLD,
      totalShares: TOTAL_SHARES,
      shares: payloads,
    };

    const outPath = path.resolve(__dirname, '../../../.maestro/fixtures/test-shares-pin.json');
    fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2));

    const hexShares = shares.map((s) => s.toString('hex'));
    const recovered = combine([hexShares[0], hexShares[1]]);
    expect(recovered.toString()).toBe(encryptedMnemonic);
  });
});

describe('Generate 24-word test fixtures', () => {
  it('generates 24-word 3-of-5 share payloads', () => {
    const MNEMONIC_24 =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
    const SECRET_ID = 'test-e2e-24w-001';
    const THRESHOLD = 3;
    const TOTAL_SHARES = 5;

    const secretBuffer = Buffer.from(MNEMONIC_24);
    const shares = split(secretBuffer, { shares: TOTAL_SHARES, threshold: THRESHOLD });

    const payloads = shares.map((shareBuf, i) => ({
      v: 1,
      id: SECRET_ID,
      name: 'E2E 24-word Test',
      shareIndex: i + 1,
      totalShares: TOTAL_SHARES,
      threshold: THRESHOLD,
      shareData: shareBuf.toString('hex'),
      derivationPath: "m/44'/60'/0'/0",
      pathType: 'metamask',
      wordCount: 24,
      hasPIN: false,
      hasPassphrase: false,
    }));

    const fixture = {
      mnemonic: MNEMONIC_24,
      threshold: THRESHOLD,
      totalShares: TOTAL_SHARES,
      shares: payloads,
    };

    const outPath = path.resolve(__dirname, '../../../.maestro/fixtures/test-shares-24word.json');
    fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2));

    const hexShares = shares.map((s) => s.toString('hex'));
    const recovered = combine([hexShares[0], hexShares[1], hexShares[2]]);
    expect(recovered.toString()).toBe(MNEMONIC_24);
  });
});

describe('Generate Ledger path test fixtures', () => {
  it('generates Ledger-path share payloads', () => {
    const SECRET_ID = 'test-e2e-ledger-001';
    const THRESHOLD = 2;
    const TOTAL_SHARES = 3;

    const secretBuffer = Buffer.from(TEST_MNEMONIC);
    const shares = split(secretBuffer, { shares: TOTAL_SHARES, threshold: THRESHOLD });

    const payloads = shares.map((shareBuf, i) => ({
      v: 1,
      id: SECRET_ID,
      name: 'E2E Ledger Test',
      shareIndex: i + 1,
      totalShares: TOTAL_SHARES,
      threshold: THRESHOLD,
      shareData: shareBuf.toString('hex'),
      derivationPath: "m/44'/60'/0'/0/0",
      pathType: 'ledger',
      wordCount: 12,
      hasPIN: false,
      hasPassphrase: false,
    }));

    const fixture = {
      mnemonic: TEST_MNEMONIC,
      threshold: THRESHOLD,
      totalShares: TOTAL_SHARES,
      shares: payloads,
    };

    const outPath = path.resolve(__dirname, '../../../.maestro/fixtures/test-shares-ledger.json');
    fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2));

    const hexShares = shares.map((s) => s.toString('hex'));
    const recovered = combine([hexShares[0], hexShares[1]]);
    expect(recovered.toString()).toBe(TEST_MNEMONIC);
  });
});

describe('Generate passphrase test fixtures', () => {
  it('generates passphrase-enabled share payloads', () => {
    const SECRET_ID = 'test-e2e-pass-001';
    const THRESHOLD = 2;
    const TOTAL_SHARES = 3;

    const secretBuffer = Buffer.from(TEST_MNEMONIC);
    const shares = split(secretBuffer, { shares: TOTAL_SHARES, threshold: THRESHOLD });

    const payloads = shares.map((shareBuf, i) => ({
      v: 1,
      id: SECRET_ID,
      name: 'E2E Passphrase Test',
      shareIndex: i + 1,
      totalShares: TOTAL_SHARES,
      threshold: THRESHOLD,
      shareData: shareBuf.toString('hex'),
      derivationPath: "m/44'/60'/0'/0",
      pathType: 'metamask',
      wordCount: 12,
      hasPIN: false,
      hasPassphrase: true,
    }));

    const fixture = {
      mnemonic: TEST_MNEMONIC,
      passphrase: 'test-passphrase',
      threshold: THRESHOLD,
      totalShares: TOTAL_SHARES,
      shares: payloads,
    };

    const outPath = path.resolve(__dirname, '../../../.maestro/fixtures/test-shares-passphrase.json');
    fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2));

    const hexShares = shares.map((s) => s.toString('hex'));
    const recovered = combine([hexShares[0], hexShares[1]]);
    expect(recovered.toString()).toBe(TEST_MNEMONIC);
  });
});
