import * as ExpoCrypto from 'expo-crypto';

/**
 * Mix multiple entropy sources by XOR-ing them together,
 * combining with system CSPRNG output, and hashing through SHA-256.
 *
 * This ensures that even if one source is weak, the result
 * is at least as strong as the strongest source.
 */
export async function mixEntropy(...sources: Uint8Array[]): Promise<Uint8Array> {
  // XOR all sources together into a 32-byte buffer
  const result = new Uint8Array(32);
  for (const source of sources) {
    for (let i = 0; i < 32; i++) {
      result[i] ^= source[i % source.length];
    }
  }

  // XOR with system CSPRNG output
  const systemEntropy = ExpoCrypto.getRandomBytes(32);
  for (let i = 0; i < 32; i++) {
    result[i] ^= systemEntropy[i];
  }

  // Final SHA-256 hash for uniform distribution
  const hashHex = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    Array.from(result).map(b => String.fromCharCode(b)).join('')
  );

  // Convert hex string back to Uint8Array
  const hash = new Uint8Array(32);
  for (let i = 0; i < 64; i += 2) {
    hash[i / 2] = parseInt(hashHex.slice(i, i + 2), 16);
  }

  return hash;
}
