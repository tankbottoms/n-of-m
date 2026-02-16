import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { NeoCard } from '../../../components/neo';
import { ColorPicker } from '../../../components/ColorPicker';
import { NEO } from '../../../constants/theme';

export default function ThemeScreen() {
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
});
