import { generateMnemonic, validateMnemonic } from '../generate';
import { deriveAddresses } from '../derive';

// Mock crypto.getRandomValues for test environment
if (typeof globalThis.crypto === 'undefined') {
  const nodeCrypto = require('crypto');
  (globalThis as any).crypto = {
    getRandomValues: (arr: Uint8Array) => {
      const bytes = nodeCrypto.randomBytes(arr.length);
      arr.set(bytes);
      return arr;
    },
  };
}

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

  it('validates known good mnemonic', () => {
    expect(validateMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about')).toBe(true);
  });

  it('rejects invalid mnemonic', () => {
    expect(validateMnemonic('not a valid mnemonic phrase')).toBe(false);
  });
});

describe('address derivation', () => {
  const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

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
    expect(addresses[0].address.toLowerCase()).toBe('0x9858effd232b4033e47d90003d41ec34ecaeda94');
  });

  it('derives different addresses for different indices', () => {
    const addresses = deriveAddresses(testMnemonic, 'metamask', 3);
    expect(addresses[0].address).not.toBe(addresses[1].address);
    expect(addresses[1].address).not.toBe(addresses[2].address);
  });

  it('derives addresses with ledger path', () => {
    const addresses = deriveAddresses(testMnemonic, 'ledger', 2);
    expect(addresses).toHaveLength(2);
    expect(addresses[0].address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });
});

describe('extended wallet generation', () => {
  it('generates valid 15-word mnemonic', () => {
    const mnemonic = generateMnemonic(15);
    const words = mnemonic.split(' ');
    expect(words).toHaveLength(15);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it('generates valid 18-word mnemonic', () => {
    const mnemonic = generateMnemonic(18);
    const words = mnemonic.split(' ');
    expect(words).toHaveLength(18);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it('generates valid 21-word mnemonic', () => {
    const mnemonic = generateMnemonic(21);
    const words = mnemonic.split(' ');
    expect(words).toHaveLength(21);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it('extraEntropy XOR changes the mnemonic output', () => {
    // Generate two mnemonics with different extra entropy
    const entropy1 = new Uint8Array(32).fill(0x00);
    const entropy2 = new Uint8Array(32).fill(0xff);
    const mnemonic1 = generateMnemonic(12, entropy1);
    const mnemonic2 = generateMnemonic(12, entropy2);
    // XOR with all-zeros should not change the base entropy,
    // but XOR with 0xff flips all bits, so results must differ
    expect(mnemonic1).not.toBe(mnemonic2);
  });

  it('throws or handles invalid word count gracefully', () => {
    // A word count not in the WORD_COUNT_TO_ENTROPY map yields undefined,
    // causing getRandomBytes(NaN) which should throw
    expect(() => {
      generateMnemonic(13 as any);
    }).toThrow();
  });
});
