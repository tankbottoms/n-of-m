import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { NeoButton, NeoCard } from '../../../components/neo';
import { MnemonicGrid } from '../../../components/MnemonicGrid';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useGenerateFlow } from '../../../hooks/useGenerateFlow';
import { validateMnemonic } from '../../../lib/wallet';
import { WordCount } from '../../../constants/types';

const VALID_WORD_COUNTS = [12, 15, 18, 21, 24];

export default function ImportScreen() {
  const { highlight } = useTheme();
  const { update } = useGenerateFlow();

  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);

  const words = input
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const handleValidate = useCallback(() => {
    setError(null);
    setValidated(false);

    if (words.length === 0) {
      setError('Please enter a seed phrase.');
      return;
    }

    if (!VALID_WORD_COUNTS.includes(words.length)) {
      setError(`Invalid word count (${words.length}). Must be 12, 15, 18, 21, or 24 words.`);
      return;
    }

    const phrase = words.join(' ');
    if (!validateMnemonic(phrase)) {
      setError('Invalid BIP39 mnemonic. Check your words and try again.');
      return;
    }

    setValidated(true);
  }, [words]);

  const handleContinue = useCallback(() => {
    const phrase = words.join(' ');
    const wordCount = words.length as WordCount;
    update({ mnemonic: phrase, wordCount });
    router.push('/(tabs)/generate/derivation');
  }, [words, update]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Import Phrase</Text>
      <Text style={styles.subtitle}>
        Enter your existing BIP39 seed phrase. Words should be separated by spaces.
      </Text>

      <NeoCard title="Seed Phrase">
        <TextInput
          style={styles.textInput}
          multiline
          numberOfLines={4}
          value={input}
          onChangeText={(text) => {
            setInput(text);
            setValidated(false);
            setError(null);
          }}
          placeholder="Enter your seed phrase words separated by spaces..."
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="top"
        />
        {words.length > 0 && (
          <Text style={styles.wordCountLabel}>
            {words.length} word{words.length !== 1 ? 's' : ''}
          </Text>
        )}
      </NeoCard>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!validated ? (
        <NeoButton
          title="Validate"
          onPress={handleValidate}
          disabled={words.length === 0}
          style={{ marginTop: 16 }}
        />
      ) : (
        <View style={styles.validatedSection}>
          <NeoCard title={`${words.length}-Word Mnemonic`} style={{ marginTop: 16 }}>
            <MnemonicGrid words={words} revealed={true} />
            <View style={[styles.validBadge, { borderColor: highlight }]}>
              <Text style={[styles.validText, { color: highlight }]}>
                Valid BIP39 Mnemonic
              </Text>
            </View>
          </NeoCard>

          <NeoButton
            title="Continue"
            onPress={handleContinue}
            style={{ marginTop: 16 }}
          />
        </View>
      )}

      <Text style={styles.warningText}>
        Make sure no one can see your screen. Your seed phrase gives full access to your funds.
      </Text>
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
  textInput: {
    fontFamily: NEO.fontMono,
    fontSize: 15,
    color: NEO.text,
    borderWidth: 2,
    borderColor: '#DDD',
    padding: 12,
    minHeight: 100,
    lineHeight: 24,
  },
  wordCountLabel: {
    fontFamily: NEO.fontUIBold,
    fontSize: 12,
    color: '#999',
    textTransform: 'uppercase',
    marginTop: 8,
    textAlign: 'right',
  },
  errorBox: {
    borderWidth: 2,
    borderColor: '#CC0000',
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: '#CC0000',
    lineHeight: 20,
  },
  validatedSection: {},
  validBadge: {
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  validText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  warningText: {
    fontFamily: NEO.fontUI,
    fontSize: 12,
    color: '#CC6600',
    marginTop: 24,
    lineHeight: 18,
    textAlign: 'center',
  },
});
