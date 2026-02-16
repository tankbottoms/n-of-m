import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { NeoCard, NeoButton } from '../../../components/neo';
import { NEO } from '../../../constants/theme';
import { router } from 'expo-router';

export default function VaultScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <NeoCard title="Vault">
        <Text style={styles.text}>No secrets saved yet.</Text>
        <NeoButton
          title="Generate a Secret"
          variant="secondary"
          onPress={() => router.push('/(tabs)/generate')}
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
