import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NEO } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface ScanProgressProps {
  scanned: number;
  threshold: number;
}

export function ScanProgress({ scanned, threshold }: ScanProgressProps) {
  const { highlight } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        SCANNED {scanned} OF {threshold} REQUIRED
      </Text>
      <View style={styles.dots}>
        {Array.from({ length: threshold }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < scanned && { backgroundColor: highlight },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 16 },
  label: {
    fontFamily: NEO.fontUIBold,
    fontSize: 16,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  dot: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: NEO.border,
    backgroundColor: 'transparent',
  },
});
