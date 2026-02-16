import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { NeoButton, NeoCard } from '../../../components/neo';
import { NEO } from '../../../constants/theme';
import { router } from 'expo-router';

export default function GenerateScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <NeoCard title="Generate New Secret">
        <Text style={styles.text}>
          Create a new BIP39 seed phrase and split it into Shamir shares.
        </Text>
        <NeoButton
          title="Start"
          onPress={() => router.push('/(tabs)/generate/entropy')}
          style={{ marginTop: 16 }}
        />
      </NeoCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg },
  content: { padding: 16, paddingTop: 16 },
  text: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: NEO.text,
    lineHeight: 22,
  },
});
