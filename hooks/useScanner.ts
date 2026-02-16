import { useState, useCallback, useRef } from 'react';
import { SharePayload } from '../constants/types';

export type ScanState = 'idle' | 'scanning' | 'pin_required' | 'reconstructing' | 'done' | 'error';

export function useScanner() {
  const [state, setState] = useState<ScanState>('idle');
  const [scannedShares, setScannedShares] = useState<SharePayload[]>([]);
  const [targetThreshold, setTargetThreshold] = useState(0);
  const [targetTotal, setTargetTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const secretIdRef = useRef<string | null>(null);

  const onScan = useCallback((data: string): boolean => {
    try {
      const payload: SharePayload = JSON.parse(data);

      if (payload.v !== 1 || !payload.shareData) {
        setError('Invalid QR code - not a Shamir share');
        return false;
      }

      let accepted = true;

      setScannedShares(prev => {
        // First share sets the target
        if (prev.length === 0) {
          secretIdRef.current = payload.id;
          setTargetThreshold(payload.threshold);
          setTargetTotal(payload.totalShares);
        } else {
          if (payload.id !== secretIdRef.current) {
            setError('This share belongs to a different secret');
            accepted = false;
            return prev;
          }
          if (prev.some(s => s.shareIndex === payload.shareIndex)) {
            setError(`Share #${payload.shareIndex} already scanned`);
            accepted = false;
            return prev;
          }
        }

        setError(null);
        const updated = [...prev, payload];

        if (updated.length >= payload.threshold) {
          if (payload.hasPIN || payload.hasPassphrase) {
            setState('pin_required');
          } else {
            setState('reconstructing');
          }
        }

        return updated;
      });

      return accepted;
    } catch {
      setError('Could not parse QR code');
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setScannedShares([]);
    setTargetThreshold(0);
    setTargetTotal(0);
    setError(null);
    secretIdRef.current = null;
  }, []);

  return {
    state, setState,
    scannedShares,
    targetThreshold, targetTotal,
    error, setError,
    onScan, reset,
  };
}
