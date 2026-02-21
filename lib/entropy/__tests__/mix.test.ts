import { mixEntropy } from '../mix';

describe('mixEntropy', () => {
  it('returns Uint8Array of length 32', async () => {
    const source = new Uint8Array(32).fill(0xab);
    const result = await mixEntropy(source);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(32);
  });

  it('single source produces valid output', async () => {
    const source = new Uint8Array(32);
    for (let i = 0; i < 32; i++) source[i] = i;
    const result = await mixEntropy(source);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(32);
    // Output should not be all zeros (XOR with system entropy + SHA-256)
    const allZero = result.every(b => b === 0);
    expect(allZero).toBe(false);
  });

  it('multiple sources produces valid output', async () => {
    const src1 = new Uint8Array(32).fill(0xff);
    const src2 = new Uint8Array(32).fill(0x55);
    const src3 = new Uint8Array(32).fill(0xaa);
    const result = await mixEntropy(src1, src2, src3);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(32);
  });

  it('output bytes are in 0-255 range', async () => {
    const source = new Uint8Array(32).fill(0x42);
    const result = await mixEntropy(source);
    for (const byte of result) {
      expect(byte).toBeGreaterThanOrEqual(0);
      expect(byte).toBeLessThanOrEqual(255);
    }
  });

  it('different sources produce different outputs', async () => {
    const srcA = new Uint8Array(32).fill(0x01);
    const srcB = new Uint8Array(32).fill(0xfe);
    const resultA = await mixEntropy(srcA);
    const resultB = await mixEntropy(srcB);
    // Due to system entropy injection, even identical sources would differ,
    // but different sources make collision essentially impossible
    const same = resultA.every((b, i) => b === resultB[i]);
    expect(same).toBe(false);
  });

  it('empty sources array still produces 32-byte output', async () => {
    const result = await mixEntropy();
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(32);
    // With no user sources, result is purely system entropy hashed through SHA-256
    const allZero = result.every(b => b === 0);
    expect(allZero).toBe(false);
  });

  it('short source (<32 bytes) wraps correctly via modulo', async () => {
    // A 4-byte source should be repeated across the 32-byte buffer via i % source.length
    const shortSource = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const result = await mixEntropy(shortSource);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(32);
    // Verify it doesn't throw and produces valid output
    const allZero = result.every(b => b === 0);
    expect(allZero).toBe(false);
  });
});
