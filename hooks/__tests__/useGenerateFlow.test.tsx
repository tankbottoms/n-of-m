import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { useGenerateFlow, GenerateFlowProvider } from '../useGenerateFlow';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GenerateFlowProvider>{children}</GenerateFlowProvider>
);

describe('useGenerateFlow', () => {
  it('initial state has correct defaults', () => {
    const { result } = renderHook(() => useGenerateFlow(), { wrapper });

    expect(result.current.state).toEqual({
      mnemonic: '',
      wordCount: 24,
      pathType: 'metamask',
      addressCount: 10,
      threshold: 3,
      totalShares: 5,
      name: '',
      shares: [],
      pinnedAddresses: [],
    });
  });

  it('update merges partial state', () => {
    const { result } = renderHook(() => useGenerateFlow(), { wrapper });

    act(() => {
      result.current.update({ name: 'My Wallet', wordCount: 12 });
    });

    expect(result.current.state.name).toBe('My Wallet');
    expect(result.current.state.wordCount).toBe(12);
    expect(result.current.state.threshold).toBe(3);
  });

  it('reset returns to initial state', () => {
    const { result } = renderHook(() => useGenerateFlow(), { wrapper });

    act(() => {
      result.current.update({
        name: 'Modified',
        mnemonic: 'test mnemonic',
        threshold: 5,
      });
    });

    expect(result.current.state.name).toBe('Modified');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toEqual({
      mnemonic: '',
      wordCount: 24,
      pathType: 'metamask',
      addressCount: 10,
      threshold: 3,
      totalShares: 5,
      name: '',
      shares: [],
      pinnedAddresses: [],
    });
  });

  it('multiple updates accumulate', () => {
    const { result } = renderHook(() => useGenerateFlow(), { wrapper });

    act(() => {
      result.current.update({ name: 'Step 1' });
    });

    act(() => {
      result.current.update({ wordCount: 18 });
    });

    act(() => {
      result.current.update({ threshold: 4, totalShares: 7 });
    });

    expect(result.current.state.name).toBe('Step 1');
    expect(result.current.state.wordCount).toBe(18);
    expect(result.current.state.threshold).toBe(4);
    expect(result.current.state.totalShares).toBe(7);
    expect(result.current.state.pathType).toBe('metamask');
  });

  it('throws when used outside provider', () => {
    // Suppress expected console.error from React about uncaught errors
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useGenerateFlow());
    }).toThrow('useGenerateFlow must be used within GenerateFlowProvider');

    spy.mockRestore();
  });
});
