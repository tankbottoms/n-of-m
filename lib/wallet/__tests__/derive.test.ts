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

const testMnemonic =
  'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

describe('deriveAddresses', () => {
  it('custom path with {index} placeholder', () => {
    const customPath = "m/44'/60'/0'/1/{index}";
    const addresses = deriveAddresses(testMnemonic, 'custom', 3, customPath);
    expect(addresses).toHaveLength(3);
    // Each address should be valid and unique
    const uniqueAddresses = new Set(addresses.map(a => a.address));
    expect(uniqueAddresses.size).toBe(3);
  });

  it('passphrase changes derived addresses', () => {
    const withoutPassphrase = deriveAddresses(testMnemonic, 'metamask', 1);
    const withPassphrase = deriveAddresses(testMnemonic, 'metamask', 1, undefined, 'my-secret');
    expect(withoutPassphrase[0].address).not.toBe(withPassphrase[0].address);
    expect(withoutPassphrase[0].privateKey).not.toBe(withPassphrase[0].privateKey);
  });

  it('ledger path produces different addresses than metamask', () => {
    const metamaskAddresses = deriveAddresses(testMnemonic, 'metamask', 3);
    const ledgerAddresses = deriveAddresses(testMnemonic, 'ledger', 3);
    // At index 0, both paths resolve to m/44'/60'/0'/0/0, so they match.
    // At index >= 1 the paths diverge (metamask: .../0/{i}, ledger: .../{i}'/0/0).
    expect(metamaskAddresses[0].address).toBe(ledgerAddresses[0].address);
    expect(metamaskAddresses[1].address).not.toBe(ledgerAddresses[1].address);
    expect(metamaskAddresses[2].address).not.toBe(ledgerAddresses[2].address);
  });

  it('count=0 returns empty array', () => {
    const addresses = deriveAddresses(testMnemonic, 'metamask', 0);
    expect(addresses).toEqual([]);
  });

  it('index values are sequential 0..n-1', () => {
    const count = 5;
    const addresses = deriveAddresses(testMnemonic, 'metamask', count);
    for (let i = 0; i < count; i++) {
      expect(addresses[i].index).toBe(i);
    }
  });

  it('address format is 0x + 40 hex chars', () => {
    const addresses = deriveAddresses(testMnemonic, 'metamask', 5);
    for (const addr of addresses) {
      expect(addr.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    }
  });

  it('privateKey format is 0x + 64 hex chars', () => {
    const addresses = deriveAddresses(testMnemonic, 'metamask', 5);
    for (const addr of addresses) {
      expect(addr.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
    }
  });

  it('known ledger first address for test vector mnemonic', () => {
    const addresses = deriveAddresses(testMnemonic, 'ledger', 1);
    // Known first address for "abandon..." mnemonic with Ledger path m/44'/60'/0'/0/0
    expect(addresses[0].address.toLowerCase()).toBe('0x9858effd232b4033e47d90003d41ec34ecaeda94');
  });
});
