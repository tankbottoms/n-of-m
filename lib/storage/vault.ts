import * as FileSystem from 'expo-file-system/legacy';
import { SecretRecord } from '../../constants/types';
import { encrypt, decrypt } from '../crypto/aes';
import { initMasterKey } from './keys';

const VAULT_FILE = FileSystem.documentDirectory + 'shamir_vault.enc';

async function readVault(): Promise<SecretRecord[]> {
  const key = await initMasterKey();
  try {
    const info = await FileSystem.getInfoAsync(VAULT_FILE);
    if (!info.exists) return [];
    const encrypted = await FileSystem.readAsStringAsync(VAULT_FILE);
    if (!encrypted) return [];
    const json = await decrypt(encrypted, key);
    return JSON.parse(json);
  } catch {
    return [];
  }
}

async function writeVault(records: SecretRecord[]): Promise<void> {
  const key = await initMasterKey();
  const json = JSON.stringify(records);
  const encrypted = await encrypt(json, key);
  await FileSystem.writeAsStringAsync(VAULT_FILE, encrypted);
}

export async function getAllSecrets(): Promise<SecretRecord[]> {
  return readVault();
}

export async function getSecret(id: string): Promise<SecretRecord | undefined> {
  const records = await readVault();
  return records.find((r) => r.id === id);
}

export async function saveSecret(record: SecretRecord): Promise<void> {
  const records = await readVault();
  const idx = records.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  await writeVault(records);
}

export async function updateSecret(id: string, updates: Partial<SecretRecord>): Promise<void> {
  const records = await readVault();
  const idx = records.findIndex((r) => r.id === id);
  if (idx >= 0) {
    records[idx] = { ...records[idx], ...updates };
    await writeVault(records);
  }
}

export async function deleteSecret(id: string): Promise<void> {
  const records = await readVault();
  await writeVault(records.filter((r) => r.id !== id));
}
