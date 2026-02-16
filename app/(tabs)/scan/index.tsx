import React from 'react';
import { Text, ScrollView, StyleSheet } from 'react-native';
import { NeoCard } from '../../../components/neo';
import { NEO } from '../../../constants/theme';

export default function ScanScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <NeoCard title="Scan Shares">
        <Text style={styles.text}>
          Scan QR codes to reconstruct your secret. Camera access required.
        </Text>
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
