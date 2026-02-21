import { deriveKey, generateSalt } from '../kdf';

describe('KDF', () => {
  jest.setTimeout(30000);

  it('deriveKey returns a 64-char hex string', async () => {
    const result = await deriveKey('1234', 'abcdef0123456789abcdef0123456789');
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it('deriveKey is deterministic (same pin + salt = same result)', async () => {
    const salt = 'deadbeefdeadbeefdeadbeefdeadbeef';
    const a = await deriveKey('mypin', salt);
    const b = await deriveKey('mypin', salt);
    expect(a).toBe(b);
  });

  it('different pins produce different keys', async () => {
    const salt = '00112233445566778899aabbccddeeff';
    const a = await deriveKey('pin1', salt);
    const b = await deriveKey('pin2', salt);
    expect(a).not.toBe(b);
  });

  it('different salts produce different keys', async () => {
    const a = await deriveKey('samepin', 'salt_a_salt_a_salt_a_salt_a_salt');
    const b = await deriveKey('samepin', 'salt_b_salt_b_salt_b_salt_b_salt');
    expect(a).not.toBe(b);
  });

  it('generateSalt returns a 32-char hex string', () => {
    const salt = generateSalt();
    expect(salt).toHaveLength(32);
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
  });

  it('generateSalt produces unique values', () => {
    const salts = new Set(Array.from({ length: 10 }, () => generateSalt()));
    expect(salts.size).toBe(10);
  });

  it('deriveKey output is valid hex', async () => {
    const result = await deriveKey('test', 'aabbccddaabbccddaabbccddaabbccdd');
    for (const ch of result) {
      expect('0123456789abcdef').toContain(ch);
    }
  });

  it('empty pin still produces a valid key', async () => {
    const result = await deriveKey('', 'aabbccddaabbccddaabbccddaabbccdd');
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});
