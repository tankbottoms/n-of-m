import { getCameraEntropy } from '../camera';

describe('getCameraEntropy', () => {
  it('returns Uint8Array of length 32', async () => {
    const result = await getCameraEntropy();
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(32);
  });

  it('consecutive calls produce different values', async () => {
    const result1 = await getCameraEntropy();
    const result2 = await getCameraEntropy();
    // Timing inputs (Date.now, performance.now, Math.random) differ between calls
    const same = result1.every((b, i) => b === result2[i]);
    expect(same).toBe(false);
  });

  it('all bytes in valid 0-255 range', async () => {
    const result = await getCameraEntropy();
    for (const byte of result) {
      expect(byte).toBeGreaterThanOrEqual(0);
      expect(byte).toBeLessThanOrEqual(255);
    }
  });
});
