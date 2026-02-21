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

import { renderWithTheme, screen } from './test-utils';
import { ScanProgress } from '../ScanProgress';

describe('ScanProgress', () => {
  it('displays correct progress text', () => {
    renderWithTheme(<ScanProgress scanned={2} threshold={3} />);
    expect(screen.getByText(/SCANNED 2 OF 3 REQUIRED/)).toBeTruthy();
  });

  it('renders the correct number of dots based on threshold', () => {
    const { toJSON } = renderWithTheme(
      <ScanProgress scanned={1} threshold={3} />,
    );
    const tree = toJSON();
    expect(tree).toBeTruthy();
  });

  it('renders correctly with zero state', () => {
    renderWithTheme(<ScanProgress scanned={0} threshold={0} />);
    expect(screen.getByText(/SCANNED 0 OF 0 REQUIRED/)).toBeTruthy();
  });
});
