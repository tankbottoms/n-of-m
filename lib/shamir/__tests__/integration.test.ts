import { Buffer } from 'buffer';
import { split, combine } from '../index';
import { MAX_SHARES } from '../constants';

describe('Shamir Secret Sharing integration', () => {
  it('split returns correct number of shares', () => {
    const secret = Buffer.from('secret');
    const shares = split(secret, { shares: 5, threshold: 3 });
    expect(shares).toHaveLength(5);
    expect(shares.every((s) => Buffer.isBuffer(s))).toBe(true);
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

  it('works with hex string shares', () => {
    const secret = 'secret';
    const shares = split(secret, { shares: 3, threshold: 2 });
    const hexShares = shares.map((s) => s.toString('hex'));
    const recovered = combine(hexShares);
    expect(recovered.toString()).toBe(secret);
  });

  it('throws on invalid input', () => {
    expect(() => split('', { shares: 3, threshold: 2 })).toThrow(TypeError);
    expect(() => split('secret', { shares: 0, threshold: 1 })).toThrow(RangeError);
    expect(() => split('secret', { shares: 3, threshold: 4 })).toThrow(RangeError);
    expect(() => split('secret', { shares: MAX_SHARES + 1, threshold: 2 })).toThrow(
      RangeError,
    );
  });

  // Deterministic test with seeded random for reproducible shares
  it('compat: combines deterministic shares for "key"', () => {
    const secret = Buffer.from('key');
    // Use a deterministic PRNG so shares are always the same
    let seed = 42;
    const deterministicRandom = (size: number): Buffer => {
      const arr = new Uint8Array(size);
      for (let i = 0; i < size; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        arr[i] = seed & 0xff;
      }
      return Buffer.from(arr);
    };

    const shares = split(secret, {
      shares: 3,
      threshold: 2,
      random: deterministicRandom,
    });
    const hexShares = shares.map((s) => s.toString('hex'));

    // Verify round-trip with just 2 shares (threshold)
    const recovered = combine([hexShares[0], hexShares[1]]);
    expect(Buffer.compare(recovered, secret)).toBe(0);

    // Verify any 2 of 3 works
    const recovered2 = combine([hexShares[0], hexShares[2]]);
    expect(Buffer.compare(recovered2, secret)).toBe(0);

    const recovered3 = combine([hexShares[1], hexShares[2]]);
    expect(Buffer.compare(recovered3, secret)).toBe(0);
  });

  it('compat: share format has correct structure', () => {
    const secret = Buffer.from('test');
    const shares = split(secret, { shares: 3, threshold: 2 });
    for (const share of shares) {
      const hex = share.toString('hex');
      // Shares should start with '08' prefix (0 + 8 for BIT_COUNT in base36)
      expect(hex.startsWith('08')).toBe(true);
      // All shares should be the same length
      expect(hex.length).toBe(shares[0].toString('hex').length);
    }
  });
});
