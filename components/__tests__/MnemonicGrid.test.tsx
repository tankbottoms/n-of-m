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

import { renderWithTheme, screen, fireEvent } from './test-utils';
import { MnemonicGrid } from '../MnemonicGrid';

const SAMPLE_WORDS = ['abandon', 'ability', 'able', 'about', 'above', 'absent'];

describe('MnemonicGrid', () => {
  it('renders all words when revealed', () => {
    renderWithTheme(<MnemonicGrid words={SAMPLE_WORDS} revealed={true} />);
    for (const word of SAMPLE_WORDS) {
      expect(screen.getByText(word)).toBeTruthy();
    }
  });

  it('renders index numbers starting at 1', () => {
    renderWithTheme(<MnemonicGrid words={SAMPLE_WORDS} revealed={true} />);
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
  });

  it('shows masked text when revealed is false', () => {
    renderWithTheme(<MnemonicGrid words={SAMPLE_WORDS} revealed={false} />);
    const masked = screen.getAllByText('****');
    expect(masked).toHaveLength(SAMPLE_WORDS.length);
  });

  it('shows actual words when revealed is true', () => {
    renderWithTheme(<MnemonicGrid words={SAMPLE_WORDS} revealed={true} />);
    expect(screen.queryAllByText('****')).toHaveLength(0);
    expect(screen.getByText('abandon')).toBeTruthy();
  });

  it('toggle button shows HIDE when revealed is true', () => {
    const onToggle = jest.fn();
    renderWithTheme(
      <MnemonicGrid words={SAMPLE_WORDS} revealed={true} onToggleReveal={onToggle} />,
    );
    expect(screen.getByText('HIDE')).toBeTruthy();
  });

  it('toggle button shows REVEAL when revealed is false', () => {
    const onToggle = jest.fn();
    renderWithTheme(
      <MnemonicGrid words={SAMPLE_WORDS} revealed={false} onToggleReveal={onToggle} />,
    );
    expect(screen.getByText('REVEAL')).toBeTruthy();
  });

  it('calls onToggleReveal when toggle button is pressed', () => {
    const onToggle = jest.fn();
    renderWithTheme(
      <MnemonicGrid words={SAMPLE_WORDS} revealed={true} onToggleReveal={onToggle} />,
    );
    fireEvent.press(screen.getByText('HIDE'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('does not render toggle button when onToggleReveal is not provided', () => {
    renderWithTheme(<MnemonicGrid words={SAMPLE_WORDS} revealed={true} />);
    expect(screen.queryByText('HIDE')).toBeNull();
    expect(screen.queryByText('REVEAL')).toBeNull();
  });
});
