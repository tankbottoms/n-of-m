import * as SecureStore from 'expo-secure-store';
import * as ExpoCrypto from 'expo-crypto';
import { generateSalt, deriveKey } from '../crypto/kdf';

const MASTER_KEY_KEY = 'shamir_master_key';
const SALT_KEY = 'shamir_master_salt';
const PIN_HASH_KEY = 'shamir_pin_hash';

export async function initMasterKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(MASTER_KEY_KEY);
  if (!key) {
    const bytes = ExpoCrypto.getRandomBytes(32);
    key = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    await SecureStore.setItemAsync(MASTER_KEY_KEY, key);
  }
  return key;
}

export async function getMasterKey(): Promise<string | null> {
  return SecureStore.getItemAsync(MASTER_KEY_KEY);
}

export async function setPIN(pin: string): Promise<void> {
  const salt = generateSalt();
  const hash = await deriveKey(pin, salt);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
  await SecureStore.setItemAsync(SALT_KEY, salt);
}

export async function verifyPIN(pin: string): Promise<boolean> {
  const storedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  const salt = await SecureStore.getItemAsync(SALT_KEY);
  if (!storedHash || !salt) return false;
  const hash = await deriveKey(pin, salt);
  return hash === storedHash;
}

export async function hasPIN(): Promise<boolean> {
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  return hash !== null;
}
