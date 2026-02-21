import React from 'react';

jest.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    highlight: '#A8D8EA',
    setHighlight: jest.fn(),
    borderWidth: 3,
    setBorderWidth: jest.fn(),
    neo: {
      bg: '#FFFFFF',
      text: '#000000',
      border: '#000000',
      borderWidth: 3,
      shadowOffset: 4,
      shadowColor: '#000000',
      radius: 0,
      defaultHighlight: '#A8D8EA',
      fontUI: 'System',
      fontUIBold: 'System',
      fontMono: 'Courier',
      fontIcon: 'System',
      fontIconBold: 'System',
    },
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

import { renderWithTheme, screen, fireEvent } from './test-utils';
import { AddressRow } from '../AddressRow';
import { DerivedAddress } from '../../constants/types';

const MOCK_ADDRESS: DerivedAddress = {
  index: 0,
  address: '0x1234567890abcdef1234567890abcdef12345678',
  privateKey: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
};

describe('AddressRow', () => {
  it('renders the address text', () => {
    renderWithTheme(<AddressRow address={MOCK_ADDRESS} />);
    expect(screen.getByText(MOCK_ADDRESS.address)).toBeTruthy();
  });

  it('renders derivationPath when provided', () => {
    renderWithTheme(
      <AddressRow address={MOCK_ADDRESS} derivationPath="m/44'/60'/0'/0/0" />,
    );
    expect(screen.getByText("m/44'/60'/0'/0/0")).toBeTruthy();
  });

  it('renders index when derivationPath is not provided', () => {
    renderWithTheme(<AddressRow address={MOCK_ADDRESS} />);
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('KEY button toggles to show private key then HIDE toggles back', () => {
    renderWithTheme(<AddressRow address={MOCK_ADDRESS} />);

    // Initially shows KEY button, private key is hidden
    expect(screen.getByText('KEY')).toBeTruthy();
    expect(screen.queryByText(MOCK_ADDRESS.privateKey)).toBeNull();

    // Press KEY to reveal private key
    fireEvent.press(screen.getByText('KEY'));
    expect(screen.getByText(MOCK_ADDRESS.privateKey)).toBeTruthy();
    expect(screen.getByText('HIDE')).toBeTruthy();

    // Press HIDE to conceal private key
    fireEvent.press(screen.getByText('HIDE'));
    expect(screen.queryByText(MOCK_ADDRESS.privateKey)).toBeNull();
    expect(screen.getByText('KEY')).toBeTruthy();
  });

  it('renders pin star when onTogglePin is provided', () => {
    const onTogglePin = jest.fn();
    renderWithTheme(
      <AddressRow address={MOCK_ADDRESS} pinned={false} onTogglePin={onTogglePin} />,
    );
    // Unpinned shows empty star (U+2606)
    expect(screen.getByText('\u2606')).toBeTruthy();
  });

  it('renders filled star when pinned is true', () => {
    const onTogglePin = jest.fn();
    renderWithTheme(
      <AddressRow address={MOCK_ADDRESS} pinned={true} onTogglePin={onTogglePin} />,
    );
    // Pinned shows filled star (U+2605)
    expect(screen.getByText('\u2605')).toBeTruthy();
  });

  it('calls onTogglePin when star is pressed', () => {
    const onTogglePin = jest.fn();
    renderWithTheme(
      <AddressRow address={MOCK_ADDRESS} pinned={false} onTogglePin={onTogglePin} />,
    );
    fireEvent.press(screen.getByText('\u2606'));
    expect(onTogglePin).toHaveBeenCalledTimes(1);
  });

  it('does not render star button when onTogglePin is not provided', () => {
    renderWithTheme(<AddressRow address={MOCK_ADDRESS} />);
    expect(screen.queryByText('\u2605')).toBeNull();
    expect(screen.queryByText('\u2606')).toBeNull();
  });
});
