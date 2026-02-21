import React from 'react';

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
import { NeoButton } from '../../neo/Button';

describe('NeoButton', () => {
  it('renders the title text', () => {
    renderWithTheme(<NeoButton title="Submit" />);
    expect(screen.getByText('Submit')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    renderWithTheme(<NeoButton title="Tap me" onPress={onPress} />);
    fireEvent.press(screen.getByText('Tap me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    renderWithTheme(<NeoButton title="Disabled" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders with default primary variant', () => {
    renderWithTheme(<NeoButton title="Primary" />);
    expect(screen.getByText('Primary')).toBeTruthy();
  });

  it('renders with secondary variant', () => {
    renderWithTheme(<NeoButton title="Secondary" variant="secondary" />);
    expect(screen.getByText('Secondary')).toBeTruthy();
  });

  it('renders with danger variant', () => {
    renderWithTheme(<NeoButton title="Danger" variant="danger" />);
    expect(screen.getByText('Danger')).toBeTruthy();
  });

  it('renders small size without crashing', () => {
    renderWithTheme(<NeoButton title="Small" size="sm" />);
    expect(screen.getByText('Small')).toBeTruthy();
  });

  it('renders large size without crashing', () => {
    renderWithTheme(<NeoButton title="Large" size="lg" />);
    expect(screen.getByText('Large')).toBeTruthy();
  });
});
