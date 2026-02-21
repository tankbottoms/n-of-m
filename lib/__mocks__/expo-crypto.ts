import * as crypto from 'crypto';

export function getRandomBytes(size: number): Uint8Array {
  return new Uint8Array(crypto.randomBytes(size));
}

export const CryptoDigestAlgorithm = {
  SHA256: 'SHA-256',
  SHA384: 'SHA-384',
  SHA512: 'SHA-512',
} as const;

export async function digestStringAsync(
  algorithm: string,
  data: string
): Promise<string> {
  const nodeAlg = algorithm === 'SHA-256' ? 'sha256' : algorithm === 'SHA-384' ? 'sha384' : 'sha512';
  return crypto.createHash(nodeAlg).update(data).digest('hex');
}
