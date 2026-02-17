import * as ExpoCrypto from 'expo-crypto';

const KDF_ITERATIONS = 10_000;

export async function deriveKey(pin: string, salt: string): Promise<string> {
  let derived = pin + salt;
  // Iterate SHA-256 for key stretching (OWASP minimum: 10,000)
  for (let i = 0; i < KDF_ITERATIONS; i++) {
    derived = await ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      derived
    );
  }
  return derived; // 64-char hex string (256 bits)
}

export function generateSalt(): string {
  const bytes = ExpoCrypto.getRandomBytes(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
