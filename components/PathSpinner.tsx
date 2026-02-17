import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NEO, SHADOW } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface PathSpinnerProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export function PathSpinner({ value, onChange, min = 0, max = 99, label }: PathSpinnerProps) {
  const { highlight } = useTheme();

  const increment = () => {
    if (value < max) onChange(value + 1);
  };

  const decrement = () => {
    if (value > min) onChange(value - 1);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.spinnerRow, SHADOW]}>
        <Pressable
          onPress={decrement}
          style={[styles.btn, value <= min && styles.btnDisabled]}
          disabled={value <= min}
        >
          <Text style={[styles.btnText, value <= min && styles.btnTextDisabled]}>
            {'\u25BC'}
          </Text>
        </Pressable>
        <View style={[styles.valueBox, { borderColor: highlight }]}>
          <Text style={styles.valueText}>{value}</Text>
        </View>
        <Pressable
          onPress={increment}
          style={[styles.btn, value >= max && styles.btnDisabled]}
          disabled={value >= max}
        >
          <Text style={[styles.btnText, value >= max && styles.btnTextDisabled]}>
            {'\u25B2'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontFamily: NEO.fontUIBold,
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    backgroundColor: NEO.bg,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderColor: NEO.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.3,
  },
  btnText: {
    fontFamily: NEO.fontMono,
    fontSize: 14,
    color: NEO.text,
  },
  btnTextDisabled: {
    color: '#CCC',
  },
  valueBox: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderLeftWidth: NEO.borderWidth,
    borderRightWidth: NEO.borderWidth,
    minWidth: 50,
    alignItems: 'center',
  },
  valueText: {
    fontFamily: NEO.fontMono,
    fontSize: 16,
    color: NEO.text,
    fontWeight: '700',
  },
});
