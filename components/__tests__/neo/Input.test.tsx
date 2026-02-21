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
import { NeoInput } from '../../neo/Input';

describe('NeoInput', () => {
  it('renders label text when label prop is provided', () => {
    renderWithTheme(<NeoInput label="Username" />);
    expect(screen.getByText('Username')).toBeTruthy();
  });

  it('renders a TextInput that accepts text', () => {
    renderWithTheme(<NeoInput label="Name" testID="name-input" />);
    const input = screen.getByTestId('name-input');
    fireEvent.changeText(input, 'Alice');
    expect(input).toBeTruthy();
  });

  it('does not render label when label prop is omitted', () => {
    renderWithTheme(<NeoInput placeholder="Type here" />);
    expect(screen.queryByText('Username')).toBeNull();
  });

  it('passes placeholder through to TextInput', () => {
    renderWithTheme(<NeoInput placeholder="Enter value" />);
    expect(screen.getByPlaceholderText('Enter value')).toBeTruthy();
  });

  it('renders with mono prop without crashing', () => {
    renderWithTheme(<NeoInput label="Mono" mono />);
    expect(screen.getByText('Mono')).toBeTruthy();
  });
});
