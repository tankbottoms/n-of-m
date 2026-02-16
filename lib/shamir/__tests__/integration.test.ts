import { Buffer } from 'buffer';
import { split, combine } from '../index';
import { MAX_SHARES } from '../constants';
import * as codec from '../codec';

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

  it('compat: combines original library test vectors for "key"', () => {
    const secret = Buffer.from('key');
    const shares = [
      '801a4a3ab36c3cdfb4544b9cbd8b73f5a7f',
      '802a63a4324f56b6f5c4eb27c39853a67cb',
      '8032158752f240ad2b21c14506e3ab1a555',
      '804321a970c058a5293e285780d77caa5c4',
      '8055c0555b4aa88200bd279dba2f04c88cb',
      '806916648dd60e837fe1cc66faeb2537640',
      '807dcb81758dd4603cd3a242bf73d04c3c5',
      '8085169c1fe708999b607f9f849cd6f49c2',
      '80976239d3e56d57936d634352f9a0188a8',
      '80ae9daeddec2d4ca4cce50e379d59eb1ba',
    ];
    expect(Buffer.compare(secret, combine(shares))).toBe(0);
  });

  it('compat: combines original library hex test vectors', () => {
    const secret = Buffer.from('82585c749a3db7f73009d0d6107dd650');
    const shares = [
      '80111001e523b02029c58aceebead70329000',
      '802eeb362b5be82beae3499f09bd7f9f19b1c',
      '803d5f7e5216d716a172ebe0af46ca81684f4',
      '804e1fa5670ee4c919ffd9f8c71f32a7bfbb0',
      '8050bd6ac05ceb3eeffcbbe251932ece37657',
      '8064bb52a3db02b1962ff879d32bc56de4455',
      '8078a5f11d20cbf8d907c1d295bbda1ee900a',
      '808808ff7fae45529eb13b1e9d78faeab435f',
      '809f3b0585740fd80830c355fa501a8057733',
      '80aeca744ec715290906c995aac371ed118c2',
    ];
    expect(Buffer.compare(codec.decode(secret), combine(shares))).toBe(0);
  });
});
