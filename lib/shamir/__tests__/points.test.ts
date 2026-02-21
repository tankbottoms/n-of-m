import { Buffer } from 'buffer';
import { points } from '../points';
import { lagrange } from '../lagrange';

/**
 * Deterministic PRNG for reproducible tests.
 * Uses a linear congruential generator seeded at a fixed value.
 */
function makeDeterministicRandom(initialSeed: number) {
  let seed = initialSeed;
  return (size: number): Buffer => {
    const arr = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      arr[i] = seed & 0xff;
    }
    return Buffer.from(arr);
  };
}

describe('points', () => {
  it('returns correct number of points', () => {
    const result = points(42, {
      threshold: 3,
      shares: 5,
      random: makeDeterministicRandom(1),
    });
    expect(result).toHaveLength(5);
  });

  it('x-values are 1 through n', () => {
    const result = points(42, {
      threshold: 3,
      shares: 5,
      random: makeDeterministicRandom(1),
    });
    for (let i = 0; i < result.length; i++) {
      expect(result[i].x).toBe(i + 1);
    }
  });

  it('deterministic random produces reproducible points', () => {
    const opts1 = { threshold: 3, shares: 5, random: makeDeterministicRandom(99) };
    const opts2 = { threshold: 3, shares: 5, random: makeDeterministicRandom(99) };
    const result1 = points(42, opts1);
    const result2 = points(42, opts2);
    expect(result1).toEqual(result2);
  });

  it('p(0) can be recovered via lagrange interpolation from threshold points', () => {
    const secret = 200;
    const threshold = 3;
    const nShares = 5;
    const result = points(secret, {
      threshold,
      shares: nShares,
      random: makeDeterministicRandom(7),
    });

    // Take exactly threshold points and recover p(0) = secret
    const xs = result.slice(0, threshold).map((p) => p.x);
    const ys = result.slice(0, threshold).map((p) => p.y);
    const recovered = lagrange(0, [xs, ys]);
    expect(recovered).toBe(secret);
  });

  it('different a0 values produce different y values', () => {
    const prng1 = makeDeterministicRandom(50);
    const prng2 = makeDeterministicRandom(50);
    const result1 = points(10, { threshold: 2, shares: 3, random: prng1 });
    const result2 = points(200, { threshold: 2, shares: 3, random: prng2 });

    // With same random coefficients but different a0, at least some y values must differ
    const allSame = result1.every((p, i) => p.y === result2[i].y);
    expect(allSame).toBe(false);
  });
});
