import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { NEO, PALETTES } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

export function ColorPicker() {
  const { highlight, setHighlight } = useTheme();

  return (
    <View style={styles.container}>
      {Object.entries(PALETTES).map(([key, palette]) => (
        <View key={key} style={styles.paletteGroup}>
          <Text style={styles.paletteLabel}>{palette.label}</Text>
          <View style={styles.swatchRow}>
            {palette.colors.map((color) => {
              const isSelected = highlight === color.hex;
              return (
                <Pressable
                  key={color.hex}
                  onPress={() => setHighlight(color.hex)}
                  style={[
                    styles.swatch,
                    { backgroundColor: color.hex },
                    isSelected && styles.swatchSelected,
                  ]}
                >
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  paletteGroup: {
    gap: 8,
  },
  paletteLabel: {
    fontFamily: NEO.fontUIBold,
    fontSize: 14,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatch: {
    width: 40,
    height: 40,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 4,
    borderColor: NEO.border,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '900',
    color: NEO.text,
  },
});
