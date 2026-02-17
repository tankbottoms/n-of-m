/**
 * Generate test SharePayload fixtures for Maestro E2E scan flow tests.
 *
 * Run with: npx ts-node --compiler-options '{"module":"commonjs","target":"es2020","esModuleInterop":true}' .maestro/scripts/generate-test-shares.ts
 * Or via Jest: npx jest --testPathPattern="generate-test-shares"
 */
import { Buffer } from 'buffer';
import { split } from '../../lib/shamir';

const TEST_MNEMONIC =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
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

console.log(JSON.stringify(fixture, null, 2));
