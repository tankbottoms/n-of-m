import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NEO } from '../../constants/theme';

interface NeoBadgeProps {
  text: string;
  variant?: 'highlight' | 'dark' | 'outline';
  style?: ViewStyle;
}

export function NeoBadge({ text, variant = 'highlight', style }: NeoBadgeProps) {
  const { highlight } = useTheme();

  const bg =
    variant === 'highlight'
      ? highlight
      : variant === 'dark'
        ? NEO.text
        : 'transparent';

  const textColor = variant === 'dark' ? NEO.bg : NEO.text;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg },
        variant === 'outline' && styles.outline,
        style,
      ]}
    >
      <Text style={[styles.text, { color: textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    alignSelf: 'flex-start',
  },
  outline: {
    backgroundColor: 'transparent',
  },
  text: {
    fontFamily: NEO.fontUIBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
