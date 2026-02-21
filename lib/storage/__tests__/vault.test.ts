import { getAllSecrets, getSecret, saveSecret, updateSecret, deleteSecret } from '../vault';
import { __resetStore } from '../../__mocks__/expo-secure-store';
import { __resetFiles } from '../../__mocks__/expo-file-system';
import { SecretRecord } from '../../../constants/types';

function makeRecord(id: string, name?: string): SecretRecord {
  return {
    id,
    name: name ?? `Test ${id}`,
    createdAt: Date.now(),
    mnemonic:
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    wordCount: 12,
    derivationPath: "m/44'/60'/0'/0",
    pathType: 'metamask',
    addressCount: 1,
    addresses: [{ index: 0, address: '0x1234', privateKey: '0xabcd' }],
    shamirConfig: { threshold: 2, totalShares: 3 },
    hasPassphrase: false,
    hasPIN: false,
  };
}

describe('vault', () => {
  jest.setTimeout(60000);

  beforeEach(() => {
    __resetStore();
    __resetFiles();
  });

  it('getAllSecrets returns an empty array initially', async () => {
    const secrets = await getAllSecrets();
    expect(secrets).toEqual([]);
  });

  it('saveSecret + getAllSecrets roundtrip', async () => {
    const record = makeRecord('r1');
    await saveSecret(record);
    const all = await getAllSecrets();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('r1');
    expect(all[0].name).toBe('Test r1');
  });

  it('saves and retrieves multiple records', async () => {
    await saveSecret(makeRecord('a'));
    await saveSecret(makeRecord('b'));
    await saveSecret(makeRecord('c'));
    const all = await getAllSecrets();
    expect(all).toHaveLength(3);
    const ids = all.map((r) => r.id).sort();
    expect(ids).toEqual(['a', 'b', 'c']);
  });

  it('getSecret returns a record by id', async () => {
    await saveSecret(makeRecord('find-me', 'Findable'));
    const found = await getSecret('find-me');
    expect(found).toBeDefined();
    expect(found!.name).toBe('Findable');
  });

  it('getSecret returns undefined for a missing id', async () => {
    await saveSecret(makeRecord('exists'));
    const result = await getSecret('does-not-exist');
    expect(result).toBeUndefined();
  });

  it('saveSecret updates an existing record with the same id', async () => {
    await saveSecret(makeRecord('dup', 'Original'));
    await saveSecret(makeRecord('dup', 'Updated'));
    const all = await getAllSecrets();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe('Updated');
  });

  it('updateSecret modifies specific fields', async () => {
    await saveSecret(makeRecord('upd'));
    await updateSecret('upd', { name: 'New Name', addressCount: 5 });
    const record = await getSecret('upd');
    expect(record).toBeDefined();
    expect(record!.name).toBe('New Name');
    expect(record!.addressCount).toBe(5);
    // Unchanged fields remain intact
    expect(record!.mnemonic).toContain('abandon');
  });

  it('updateSecret is a no-op for a missing id', async () => {
    await saveSecret(makeRecord('only'));
    await updateSecret('ghost', { name: 'Nope' });
    const all = await getAllSecrets();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('only');
  });

  it('deleteSecret removes a record', async () => {
    await saveSecret(makeRecord('d1'));
    await saveSecret(makeRecord('d2'));
    await deleteSecret('d1');
    const all = await getAllSecrets();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('d2');
  });

  it('deleteSecret is a no-op for a missing id', async () => {
    await saveSecret(makeRecord('keep'));
    await deleteSecret('nope');
    const all = await getAllSecrets();
    expect(all).toHaveLength(1);
  });

  it('data persists across multiple operations', async () => {
    await saveSecret(makeRecord('x'));
    await saveSecret(makeRecord('y'));
    await updateSecret('x', { name: 'X Updated' });
    await deleteSecret('y');
    await saveSecret(makeRecord('z'));

    const all = await getAllSecrets();
    expect(all).toHaveLength(2);
    const ids = all.map((r) => r.id).sort();
    expect(ids).toEqual(['x', 'z']);
    expect(all.find((r) => r.id === 'x')!.name).toBe('X Updated');
  });

  it('handles concurrent reads consistently', async () => {
    await saveSecret(makeRecord('cr'));
    const [a, b, c] = await Promise.all([
      getAllSecrets(),
      getSecret('cr'),
      getAllSecrets(),
    ]);
    expect(a).toHaveLength(1);
    expect(b).toBeDefined();
    expect(b!.id).toBe('cr');
    expect(c).toHaveLength(1);
  });

  it('returns empty array for corrupted vault file', async () => {
    // Write garbage directly to the vault file so decrypt fails
    const FileSystem = require('expo-file-system/legacy');
    const key = (await import('../keys')).initMasterKey;
    await key(); // ensure master key exists
    await FileSystem.writeAsStringAsync(
      'file:///mock-documents/shamir_vault.enc',
      'not-valid-encrypted-data'
    );
    const result = await getAllSecrets();
    expect(result).toEqual([]);
  });

  it('returns empty array for empty vault file', async () => {
    const FileSystem = require('expo-file-system/legacy');
    await FileSystem.writeAsStringAsync(
      'file:///mock-documents/shamir_vault.enc',
      ''
    );
    const result = await getAllSecrets();
    expect(result).toEqual([]);
  });
});
