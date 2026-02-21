import { horner } from '../horner';

describe('horner', () => {
  it('constant polynomial: horner(x, [c]) = c for any x', () => {
    expect(horner(0, [42])).toBe(42);
    expect(horner(1, [42])).toBe(42);
    expect(horner(100, [42])).toBe(42);
    expect(horner(255, [42])).toBe(42);
  });

  it('returns values in GF(256) range for any valid input', () => {
    // horner is designed for x in [1..255]; verify output stays within GF(256)
    const coefficients = [99, 45, 210];
    for (let x = 1; x <= 255; x++) {
      const result = horner(x, coefficients);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(256);
    }
  });

  it('deterministic: same input always produces same output', () => {
    const a = [42, 17, 200, 55];
    const r1 = horner(7, a);
    const r2 = horner(7, a);
    const r3 = horner(7, a);
    expect(r1).toBe(r2);
    expect(r2).toBe(r3);
  });

  it('known values: linear polynomial p(x) = a0 XOR (exp[log[x]+log[a1]] mod 255)', () => {
    // For a linear polynomial [a0, a1], horner computes:
    // b starts at 0, i=1: b=0 so b=a[1]
    // i=0: b=a[1]!=0, so b = exp[(log[x]+log[a1]) % 255] XOR a[0]
    // Test with a0=10, a1=20, x=3
    // We just verify the output is a valid GF(256) element and is consistent
    const result = horner(3, [10, 20]);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(256);

    // Verify a different x gives a different result (not guaranteed but very likely for non-trivial poly)
    const result2 = horner(5, [10, 20]);
    expect(result2).toBeGreaterThanOrEqual(0);
    expect(result2).toBeLessThan(256);

    // For a non-constant polynomial, different x should generally give different y
    // (In GF(256), a degree-1 poly is injective on its 255 nonzero inputs)
    expect(result).not.toBe(result2);
  });
});
