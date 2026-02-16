import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Buffer } from 'buffer';
import { NeoButton, NeoCard } from '../../../components/neo';
import { MnemonicGrid } from '../../../components/MnemonicGrid';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useGenerateFlow } from '../../../hooks/useGenerateFlow';
import { generateMnemonic } from '../../../lib/wallet';
import { WordCount } from '../../../constants/types';

const WORD_COUNTS: WordCount[] = [12, 15, 18, 21, 24];

export default function MnemonicScreen() {
  const { highlight } = useTheme();
  const { state, update } = useGenerateFlow();

  const [wordCount, setWordCount] = useState<WordCount>(state.wordCount);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(true);

  const words = mnemonic ? mnemonic.split(' ') : [];

  const handleGenerate = useCallback(() => {
    let extraEntropy: Uint8Array | undefined;
    if (state.entropy) {
      const buf = Buffer.from(state.entropy, 'base64');
      extraEntropy = new Uint8Array(buf);
    }
    const phrase = generateMnemonic(wordCount, extraEntropy);
    setMnemonic(phrase);
    setRevealed(true);
  }, [wordCount, state.entropy]);

  const handleContinue = useCallback(() => {
    if (!mnemonic) return;
    update({ mnemonic, wordCount });
    router.push({ pathname: '/(tabs)/generate/derivation' });
  }, [mnemonic, wordCount, update]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Seed Phrase</Text>
      <Text style={styles.subtitle}>
        Select word count and generate your BIP39 mnemonic.
      </Text>

      <NeoCard title="Word Count">
        <View style={styles.wordCountRow}>
          {WORD_COUNTS.map((wc) => (
            <NeoButton
              key={wc}
              title={String(wc)}
              size="sm"
              variant={wordCount === wc ? 'primary' : 'secondary'}
              onPress={() => {
                setWordCount(wc);
                setMnemonic(null);
              }}
              style={styles.wordCountBtn}
            />
          ))}
        </View>
      </NeoCard>

      <NeoButton
        title="Generate"
        onPress={handleGenerate}
        style={{ marginTop: 16 }}
      />

      {mnemonic && (
        <View style={styles.mnemonicSection}>
          <NeoCard title={`${wordCount}-Word Mnemonic`}>
            <MnemonicGrid
              words={words}
              revealed={revealed}
              onToggleReveal={() => setRevealed(!revealed)}
            />
          </NeoCard>

          <NeoButton
            title="Continue"
            onPress={handleContinue}
            style={{ marginTop: 16 }}
          />
        </View>
      )}
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
  wordCountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  wordCountBtn: {
    minWidth: 50,
  },
  mnemonicSection: {
    marginTop: 20,
  },
});
