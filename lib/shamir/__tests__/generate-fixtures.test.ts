import { Buffer } from 'buffer';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Mock expo-crypto before importing shamir (it uses expo-crypto for random)
jest.mock('expo-crypto', () => ({
  getRandomBytes: (size: number) => {
    return Array.from(crypto.randomBytes(size));
  },
}));

import { split, combine } from '../index';

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
