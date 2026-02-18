import React from 'react';
import { Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { NeoCard, NeoButton } from '../../components/neo';
import { NEO } from '../../constants/theme';
import { router } from 'expo-router';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.appName}>n of m</Text>
      <Text style={styles.title}>SHAMIR</Text>
      <Text style={styles.subtitle}>Ethereum Seed Phrase Manager</Text>

      <NeoCard title="Generate" style={styles.card}>
        <Text style={styles.text}>
          Create a new BIP39 seed phrase and split it into Shamir secret shares
          as printable QR code cards.
        </Text>
        <NeoButton
          title="New Secret"
          onPress={() => router.push('/(tabs)/generate')}
          style={{ marginTop: 12 }}
        />
      </NeoCard>

      <NeoCard title="Scan" style={styles.card}>
        <Text style={styles.text}>
          Scan your printed QR code shares to reconstruct your seed phrase.
        </Text>
        <NeoButton
          title="Scan Shares"
          variant="secondary"
          onPress={() => router.push('/(tabs)/scan')}
          style={{ marginTop: 12 }}
        />
      </NeoCard>

      <Pressable onPress={() => router.push('/how-it-works')} testID="how-it-works-link" accessibilityLabel="How It Works">
        <NeoCard title="How It Works" style={styles.card}>
          <Text style={styles.text}>
            Shamir's Secret Sharing splits your seed phrase into N shares,
            requiring any M of them to reconstruct. Store shares in different
            locations for redundancy and security.
          </Text>
          <Text style={styles.learnMore}>Tap to learn more →</Text>
        </NeoCard>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg },
  content: { padding: 16, paddingTop: 60, paddingBottom: 24 },
  appName: {
    fontFamily: NEO.fontUIBold,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 2,
  },
  title: {
    fontFamily: NEO.fontUIBold,
    fontSize: 36,
    color: NEO.text,
    textAlign: 'center',
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: { marginBottom: 16 },
  text: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: NEO.text,
    lineHeight: 22,
  },
  learnMore: {
    fontFamily: NEO.fontUIBold,
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    marginTop: 12,
    letterSpacing: 0.5,
  },
});
