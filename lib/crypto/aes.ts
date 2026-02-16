import { gcm } from '@noble/ciphers/aes';
import { randomBytes } from '@noble/ciphers/utils';

export async function encrypt(plaintext: string, keyHex: string): Promise<string> {
  const nonce = randomBytes(12);
  const keyBytes = hexToBytes(keyHex.slice(0, 64));
  const encoded = new TextEncoder().encode(plaintext);

  const cipher = gcm(keyBytes, nonce);
  const ciphertext = cipher.encrypt(encoded);

  return bytesToHex(nonce) + bytesToHex(ciphertext);
}

export async function decrypt(encrypted: string, keyHex: string): Promise<string> {
  const nonce = hexToBytes(encrypted.slice(0, 24));
  const ciphertext = hexToBytes(encrypted.slice(24));
  const keyBytes = hexToBytes(keyHex.slice(0, 64));

  const cipher = gcm(keyBytes, nonce);
  const decrypted = cipher.decrypt(ciphertext);

  return new TextDecoder().decode(decrypted);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
