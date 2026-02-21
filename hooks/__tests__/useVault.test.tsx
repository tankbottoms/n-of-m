import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useVault } from '../useVault';
import { SecretRecord } from '../../constants/types';

jest.mock('../../lib/storage/vault', () => ({
  getAllSecrets: jest.fn().mockResolvedValue([]),
  saveSecret: jest.fn().mockResolvedValue(undefined),
  updateSecret: jest.fn().mockResolvedValue(undefined),
  deleteSecret: jest.fn().mockResolvedValue(undefined),
}));

const {
  getAllSecrets,
  saveSecret,
  updateSecret,
  deleteSecret,
} = require('../../lib/storage/vault') as {
  getAllSecrets: jest.Mock;
  saveSecret: jest.Mock;
  updateSecret: jest.Mock;
  deleteSecret: jest.Mock;
};

const mockRecord: SecretRecord = {
  id: 'test-001',
  name: 'Test Secret',
  createdAt: Date.now(),
  mnemonic: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  wordCount: 12,
  derivationPath: "m/44'/60'/0'/0",
  pathType: 'metamask',
  addressCount: 1,
  addresses: [],
  shamirConfig: { threshold: 2, totalShares: 3 },
  hasPassphrase: false,
  hasPIN: false,
};

describe('useVault', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllSecrets.mockResolvedValue([]);
  });

  it('calls getAllSecrets on mount', async () => {
    renderHook(() => useVault());

    await waitFor(() => {
      expect(getAllSecrets).toHaveBeenCalledTimes(1);
    });
  });

  it('loading is false after mount completes', async () => {
    const { result } = renderHook(() => useVault());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.secrets).toEqual([]);
  });

  it('save calls saveSecret then refreshes', async () => {
    getAllSecrets
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockRecord]);

    const { result } = renderHook(() => useVault());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.save(mockRecord);
    });

    expect(saveSecret).toHaveBeenCalledWith(mockRecord);
    expect(getAllSecrets).toHaveBeenCalledTimes(2);
  });

  it('update calls updateSecret then refreshes', async () => {
    getAllSecrets
      .mockResolvedValueOnce([mockRecord])
      .mockResolvedValueOnce([{ ...mockRecord, name: 'Updated' }]);

    const { result } = renderHook(() => useVault());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.update('test-001', { name: 'Updated' });
    });

    expect(updateSecret).toHaveBeenCalledWith('test-001', { name: 'Updated' });
    expect(getAllSecrets).toHaveBeenCalledTimes(2);
  });

  it('remove calls deleteSecret then refreshes', async () => {
    getAllSecrets
      .mockResolvedValueOnce([mockRecord])
      .mockResolvedValueOnce([]);

    const { result } = renderHook(() => useVault());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.remove('test-001');
    });

    expect(deleteSecret).toHaveBeenCalledWith('test-001');
    expect(getAllSecrets).toHaveBeenCalledTimes(2);
  });

  it('refresh reloads data from vault', async () => {
    getAllSecrets
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([mockRecord]);

    const { result } = renderHook(() => useVault());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.secrets).toEqual([]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.secrets).toEqual([mockRecord]);
    expect(getAllSecrets).toHaveBeenCalledTimes(2);
  });
});
