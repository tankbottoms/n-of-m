import React from 'react';
import { Text } from 'react-native';

jest.mock('../../../hooks/useTheme', () => ({
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

import { renderWithTheme, screen, fireEvent } from '../test-utils';
import { NeoModal } from '../../neo/Modal';

describe('NeoModal', () => {
  const noop = jest.fn();

  beforeEach(() => {
    noop.mockClear();
  });

  it('renders children when visible is true', () => {
    renderWithTheme(
      <NeoModal visible={true} onClose={noop}>
        <Text>Modal content</Text>
      </NeoModal>,
    );
    expect(screen.getByText('Modal content')).toBeTruthy();
  });

  it('does not render children when visible is false', () => {
    renderWithTheme(
      <NeoModal visible={false} onClose={noop}>
        <Text>Hidden content</Text>
      </NeoModal>,
    );
    expect(screen.queryByText('Hidden content')).toBeNull();
  });

  it('renders title when provided', () => {
    renderWithTheme(
      <NeoModal visible={true} onClose={noop} title="Settings">
        <Text>Body</Text>
      </NeoModal>,
    );
    expect(screen.getByText('Settings')).toBeTruthy();
  });

  it('calls onClose when CLOSE button is pressed', () => {
    renderWithTheme(
      <NeoModal visible={true} onClose={noop}>
        <Text>Content</Text>
      </NeoModal>,
    );
    fireEvent.press(screen.getByText('CLOSE'));
    expect(noop).toHaveBeenCalledTimes(1);
  });

  it('renders children content in fullScreen mode', () => {
    renderWithTheme(
      <NeoModal visible={true} onClose={noop} fullScreen>
        <Text>Full screen content</Text>
      </NeoModal>,
    );
    expect(screen.getByText('Full screen content')).toBeTruthy();
  });
});
