import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';

export function renderWithTheme(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, options);
}

export { screen, fireEvent, waitFor, act } from '@testing-library/react-native';
