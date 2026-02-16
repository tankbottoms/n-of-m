import * as ExpoCrypto from 'expo-crypto';

export async function deriveKey(pin: string, salt: string): Promise<string> {
  let derived = pin + salt;
  // Iterate SHA-256 for key stretching
  for (let i = 0; i < 1000; i++) {
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
