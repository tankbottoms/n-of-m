import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { NeoButton, NeoCard } from '../../../components/neo';
import { NEO } from '../../../constants/theme';
import { router } from 'expo-router';

export default function GenerateScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Generate</Text>
      <Text style={styles.subtitle}>
        Create or import a seed phrase, then split it into Shamir shares.
      </Text>

      <NeoCard title="New Secret">
        <Text style={styles.text}>
          Generate a new BIP39 seed phrase with configurable entropy and word count.
        </Text>
        <NeoButton
          title="Generate New Phrase"
          onPress={() => router.push('/(tabs)/generate/entropy')}
          style={{ marginTop: 12 }}
        />
      </NeoCard>

      <NeoCard title="Import Existing" style={{ marginTop: 16 }}>
        <Text style={styles.text}>
          Enter an existing seed phrase to split it into Shamir shares for backup.
        </Text>
        <NeoButton
          title="Import Phrase"
          variant="secondary"
          onPress={() => router.push('/(tabs)/generate/import')}
          style={{ marginTop: 12 }}
        />
      </NeoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg },
  content: { padding: 16, paddingTop: 16 },
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
  text: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: NEO.text,
    lineHeight: 22,
  },
});
