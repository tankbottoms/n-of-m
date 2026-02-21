import { encrypt, decrypt } from '../aes';

const TEST_KEY = 'aa'.repeat(32); // 64 hex chars = 32 bytes

describe('AES-GCM encrypt/decrypt', () => {
  it('roundtrips a simple string', async () => {
    const plaintext = 'hello world';
    const encrypted = await encrypt(plaintext, TEST_KEY);
    const decrypted = await decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it('roundtrips unicode content', async () => {
    const plaintext = 'Hello 世界 🌍 Привет';
    const encrypted = await encrypt(plaintext, TEST_KEY);
    const decrypted = await decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it('roundtrips an empty string', async () => {
    const plaintext = '';
    const encrypted = await encrypt(plaintext, TEST_KEY);
    const decrypted = await decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it('throws when decrypting with the wrong key', async () => {
    const wrongKey = 'bb'.repeat(32);
    const encrypted = await encrypt('secret data', TEST_KEY);
    await expect(decrypt(encrypted, wrongKey)).rejects.toThrow();
  });

  it('produces output starting with a 24-char hex nonce', async () => {
    const encrypted = await encrypt('test', TEST_KEY);
    // 12 bytes nonce = 24 hex chars; verify it's valid hex
    const nonceHex = encrypted.slice(0, 24);
    expect(nonceHex).toMatch(/^[0-9a-f]{24}$/);
  });

  it('produces output longer than plaintext', async () => {
    const plaintext = 'short';
    const encrypted = await encrypt(plaintext, TEST_KEY);
    // encrypted hex is always longer: 24 nonce chars + ciphertext hex (>= plaintext bytes * 2) + GCM tag
    expect(encrypted.length).toBeGreaterThan(plaintext.length);
  });

  it('produces different ciphertexts for the same plaintext (nonce uniqueness)', async () => {
    const plaintext = 'same input every time';
    const a = await encrypt(plaintext, TEST_KEY);
    const b = await encrypt(plaintext, TEST_KEY);
    expect(a).not.toBe(b);
  });

  it('throws when decrypting malformed input', async () => {
    // Too short to contain a valid nonce + ciphertext
    await expect(decrypt('deadbeef', TEST_KEY)).rejects.toThrow();
  });

  it('roundtrips a long input (1000+ characters)', async () => {
    const plaintext = 'x'.repeat(2000);
    const encrypted = await encrypt(plaintext, TEST_KEY);
    const decrypted = await decrypt(encrypted, TEST_KEY);
    expect(decrypted).toBe(plaintext);
  });

  it('truncates key to first 64 hex chars (32 bytes)', async () => {
    const longKey = TEST_KEY + 'ff'.repeat(32); // 128 hex chars
    const encrypted = await encrypt('truncation test', longKey);
    // Decrypting with just the first 64 chars should succeed
    const decrypted = await decrypt(encrypted, longKey.slice(0, 64));
    expect(decrypted).toBe('truncation test');
  });
});
