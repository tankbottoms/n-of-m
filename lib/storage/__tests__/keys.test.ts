import { initMasterKey, getMasterKey, setPIN, verifyPIN, hasPIN } from '../keys';
import { __resetStore } from '../../__mocks__/expo-secure-store';

describe('keys', () => {
  jest.setTimeout(60000);

  beforeEach(() => {
    __resetStore();
  });

  it('initMasterKey generates a 64-char hex key', async () => {
    const key = await initMasterKey();
    expect(key).toHaveLength(64);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it('initMasterKey returns the same key on second call', async () => {
    const first = await initMasterKey();
    const second = await initMasterKey();
    expect(first).toBe(second);
  });

  it('getMasterKey returns null before init', async () => {
    const key = await getMasterKey();
    expect(key).toBeNull();
  });

  it('getMasterKey returns the key after init', async () => {
    const expected = await initMasterKey();
    const actual = await getMasterKey();
    expect(actual).toBe(expected);
  });

  it('setPIN + verifyPIN with correct PIN returns true', async () => {
    await setPIN('9999');
    const result = await verifyPIN('9999');
    expect(result).toBe(true);
  });

  it('verifyPIN with wrong PIN returns false', async () => {
    await setPIN('1234');
    const result = await verifyPIN('0000');
    expect(result).toBe(false);
  });

  it('verifyPIN returns false when no PIN is set', async () => {
    const result = await verifyPIN('1234');
    expect(result).toBe(false);
  });

  it('hasPIN returns false initially', async () => {
    const result = await hasPIN();
    expect(result).toBe(false);
  });

  it('hasPIN returns true after setPIN', async () => {
    await setPIN('5678');
    const result = await hasPIN();
    expect(result).toBe(true);
  });

  it('setPIN overwrites previous PIN', async () => {
    await setPIN('aaaa');
    await setPIN('bbbb');
    expect(await verifyPIN('aaaa')).toBe(false);
    expect(await verifyPIN('bbbb')).toBe(true);
  });
});
