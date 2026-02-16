import { useState, useEffect, useCallback } from 'react';
import { SecretRecord } from '../constants/types';
import { getAllSecrets, saveSecret, deleteSecret } from '../lib/storage/vault';

export function useVault() {
  const [secrets, setSecrets] = useState<SecretRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const records = await getAllSecrets();
    setSecrets(records);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    async (record: SecretRecord) => {
      await saveSecret(record);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteSecret(id);
      await refresh();
    },
    [refresh]
  );

  return { secrets, loading, refresh, save, remove };
}
