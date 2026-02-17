import React from 'react';
import { Text, View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { NeoCard } from '../../../components/neo';
import { ColorPicker } from '../../../components/ColorPicker';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';

const THICKNESS_OPTIONS = [1, 2, 3, 4, 5];

export default function ThemeScreen() {
  const { highlight, borderWidth, setBorderWidth } = useTheme();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Theme</Text>
      <Text style={styles.subtitle}>
        Choose a highlight color for the app. This color is used for buttons,
        badges, and accents throughout the interface.
      </Text>

      <NeoCard title="Color Palette">
        <ColorPicker />
      </NeoCard>

      <NeoCard title="Border Thickness" style={{ marginTop: 16 }}>
        <Text style={styles.thicknessHint}>
          Controls the border width throughout the app.
        </Text>
        <View style={styles.thicknessRow}>
          {THICKNESS_OPTIONS.map((w) => (
            <Pressable
              key={w}
              onPress={() => setBorderWidth(w)}
              style={[
                styles.thicknessBtn,
                { borderWidth: w },
                borderWidth === w && { backgroundColor: highlight, borderColor: NEO.border },
              ]}
            >
              <Text style={[styles.thicknessText, borderWidth === w && { fontFamily: NEO.fontUIBold }]}>
                {w}px
              </Text>
            </Pressable>
          ))}
        </View>
      </NeoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg },
  content: { padding: 16, paddingBottom: 40 },
  heading: {
    fontFamily: NEO.fontUIBold,
    fontSize: 24,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  thicknessHint: {
    fontFamily: NEO.fontUI,
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  thicknessRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  thicknessBtn: {
    borderColor: NEO.border,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 50,
    alignItems: 'center',
  },
  thicknessText: {
    fontFamily: NEO.fontMono,
    fontSize: 14,
    color: NEO.text,
  },
});
