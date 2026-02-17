import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Buffer } from 'buffer';
import { NeoButton, NeoCard } from '../../../components/neo';
import { EntropyCanvas } from '../../../components/EntropyCanvas';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useGenerateFlow } from '../../../hooks/useGenerateFlow';

type EntropyMode = 'system' | 'finger' | 'combined' | null;

export default function EntropyScreen() {
  const { highlight } = useTheme();
  const { update } = useGenerateFlow();
  const [mode, setMode] = useState<EntropyMode>(null);
  const [showCanvas, setShowCanvas] = useState(false);

  const handleSelect = useCallback((selected: EntropyMode) => {
    setMode(selected);
    if (selected === 'system') {
      // No extra entropy needed; clear any previous value and proceed
      update({ entropy: undefined });
      router.push({ pathname: '/(tabs)/generate/mnemonic' });
    } else {
      setShowCanvas(true);
    }
  }, [update]);

  const handleEntropyReady = useCallback((entropy: Uint8Array) => {
    const encoded = Buffer.from(entropy).toString('base64');
    update({ entropy: encoded });
    router.push({ pathname: '/(tabs)/generate/mnemonic' });
  }, [update]);

  const options = [
    {
      key: 'system' as const,
      title: 'System Only',
      desc: 'Uses the OS cryptographic random number generator. Secure for most users.',
    },
    {
      key: 'finger' as const,
      title: 'Motion',
      desc: 'Collect entropy from accelerometer data as you move the device. Shake or wave your phone to generate randomness.',
    },
    {
      key: 'combined' as const,
      title: 'Combined',
      desc: 'XOR motion entropy with system randomness for maximum unpredictability.',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Entropy Source</Text>
      <Text style={styles.subtitle}>
        Choose how randomness is generated for your seed phrase.
      </Text>

      {!showCanvas ? (
        <View style={styles.options}>
          {options.map((opt) => (
            <NeoCard key={opt.key} title={opt.title}>
              <Text style={styles.optionDesc}>{opt.desc}</Text>
              <NeoButton
                title={`Use ${opt.title}`}
                size="sm"
                variant={mode === opt.key ? 'primary' : 'secondary'}
                onPress={() => handleSelect(opt.key)}
                style={{ marginTop: 12 }}
              />
            </NeoCard>
          ))}
        </View>
      ) : (
        <View>
          <NeoCard title={mode === 'finger' ? 'Motion' : 'Combined'}>
            <Text style={styles.optionDesc}>
              Move your phone around to collect entropy from the accelerometer.
            </Text>
            <EntropyCanvas onEntropyReady={handleEntropyReady} />
          </NeoCard>
          <NeoButton
            title="Cancel"
            variant="secondary"
            size="sm"
            onPress={() => {
              setShowCanvas(false);
              setMode(null);
            }}
            style={{ marginTop: 12 }}
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
  options: { gap: 16 },
  optionDesc: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: NEO.text,
    lineHeight: 20,
  },
});
