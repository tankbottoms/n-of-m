import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NEO, SHADOW } from '../../constants/theme';

interface NeoCardProps {
  title?: string;
  children: ReactNode;
  style?: ViewStyle;
  showHeader?: boolean;
}

export function NeoCard({ title, children, style, showHeader = true }: NeoCardProps) {
  const { highlight } = useTheme();

  return (
    <View style={[styles.card, SHADOW, style]}>
      {showHeader && title && (
        <View style={[styles.header, { backgroundColor: highlight }]}>
          <Text style={styles.headerText}>{title}</Text>
        </View>
      )}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: NEO.bg,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: NEO.borderWidth,
    borderBottomColor: NEO.border,
  },
  headerText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 16,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: {
    padding: 16,
  },
});
