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

import { renderWithTheme, screen } from '../test-utils';
import { NeoBadge } from '../../neo/Badge';

describe('NeoBadge', () => {
  it('renders text content', () => {
    renderWithTheme(<NeoBadge text="Active" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('renders with default highlight variant', () => {
    renderWithTheme(<NeoBadge text="Highlight" />);
    expect(screen.getByText('Highlight')).toBeTruthy();
  });

  it('renders with dark variant', () => {
    renderWithTheme(<NeoBadge text="Dark" variant="dark" />);
    expect(screen.getByText('Dark')).toBeTruthy();
  });

  it('renders with outline variant', () => {
    renderWithTheme(<NeoBadge text="Outline" variant="outline" />);
    expect(screen.getByText('Outline')).toBeTruthy();
  });
});
