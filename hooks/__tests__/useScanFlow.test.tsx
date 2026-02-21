import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useScanFlow, ScanFlowProvider } from '../useScanFlow';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ScanFlowProvider>{children}</ScanFlowProvider>
);

describe('useScanFlow', () => {
  it('initial state has empty shares array', () => {
    const { result } = renderHook(() => useScanFlow(), { wrapper });

    expect(result.current.state).toEqual({ shares: [] });
  });

  it('update merges partial state', () => {
    const { result } = renderHook(() => useScanFlow(), { wrapper });

    act(() => {
      result.current.update({
        recoveredMnemonic: 'test mnemonic phrase',
        name: 'Recovered Wallet',
      });
    });

    expect(result.current.state.recoveredMnemonic).toBe('test mnemonic phrase');
    expect(result.current.state.name).toBe('Recovered Wallet');
    expect(result.current.state.shares).toEqual([]);
  });

  it('reset returns to initial state', () => {
    const { result } = renderHook(() => useScanFlow(), { wrapper });

    act(() => {
      result.current.update({
        recoveredMnemonic: 'some mnemonic',
        name: 'Modified',
        pathType: 'ledger',
        wordCount: 12,
      });
    });

    expect(result.current.state.name).toBe('Modified');
    expect(result.current.state.pathType).toBe('ledger');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toEqual({ shares: [] });
    expect(result.current.state.recoveredMnemonic).toBeUndefined();
    expect(result.current.state.name).toBeUndefined();
  });

  it('throws when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useScanFlow());
    }).toThrow('useScanFlow must be used within ScanFlowProvider');

    spy.mockRestore();
  });
});
