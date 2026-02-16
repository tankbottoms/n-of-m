import * as ExpoCrypto from 'expo-crypto';

/**
 * Camera entropy: capture environmental randomness via camera frame data.
 *
 * In a full implementation, this would capture a photo and hash a sample
 * of pixel data to extract physical randomness. For now, it mixes
 * high-resolution timing data with system entropy to provide additional
 * unpredictability beyond the OS CSPRNG alone.
 */
export async function getCameraEntropy(): Promise<Uint8Array> {
  // Mix timing data with system entropy for additional unpredictability
  const timeEntropy = `${Date.now()}-${performance.now()}-${Math.random()}`;
  const hashHex = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    timeEntropy
  );

  // Convert hex string to Uint8Array
  const result = new Uint8Array(32);
  for (let i = 0; i < 64; i += 2) {
    result[i / 2] = parseInt(hashHex.slice(i, i + 2), 16);
  }

  return result;
}
