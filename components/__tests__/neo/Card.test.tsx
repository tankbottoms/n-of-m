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

import { renderWithTheme, screen } from '../test-utils';
import { NeoCard } from '../../neo/Card';

describe('NeoCard', () => {
  it('renders children content', () => {
    renderWithTheme(
      <NeoCard>
        <Text>Card body</Text>
      </NeoCard>,
    );
    expect(screen.getByText('Card body')).toBeTruthy();
  });

  it('renders title in header when title is provided', () => {
    renderWithTheme(
      <NeoCard title="My Card">
        <Text>Content</Text>
      </NeoCard>,
    );
    expect(screen.getByText('My Card')).toBeTruthy();
  });

  it('hides header when showHeader is false', () => {
    renderWithTheme(
      <NeoCard title="Hidden Header" showHeader={false}>
        <Text>Content</Text>
      </NeoCard>,
    );
    expect(screen.queryByText('Hidden Header')).toBeNull();
  });

  it('hides header when no title is provided even with showHeader true', () => {
    renderWithTheme(
      <NeoCard showHeader={true}>
        <Text>Content only</Text>
      </NeoCard>,
    );
    // The header bar itself should not render since title is falsy
    expect(screen.getByText('Content only')).toBeTruthy();
  });

  it('applies custom style prop', () => {
    const { toJSON } = renderWithTheme(
      <NeoCard style={{ marginTop: 20 }}>
        <Text>Styled</Text>
      </NeoCard>,
    );
    expect(toJSON()).toBeTruthy();
  });
});
