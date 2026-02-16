import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { NeoButton, NeoCard } from '../../../components/neo';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useGenerateFlow } from '../../../hooks/useGenerateFlow';

const MIN_THRESHOLD = 2;
const MAX_SHARES = 10;

export default function ShamirScreen() {
  const { highlight } = useTheme();
  const { state, update } = useGenerateFlow();

  const [threshold, setThreshold] = useState(state.threshold);
  const [totalShares, setTotalShares] = useState(state.totalShares);

  const canDecThreshold = threshold > MIN_THRESHOLD;
  const canIncThreshold = threshold < totalShares;
  const canDecShares = totalShares > threshold;
  const canIncShares = totalShares < MAX_SHARES;

  const handleContinue = useCallback(() => {
    update({ threshold, totalShares });
    router.push({ pathname: '/(tabs)/generate/metadata' });
  }, [threshold, totalShares, update]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Shamir Split</Text>
      <Text style={styles.subtitle}>
        Configure how many shares to create and how many are needed for recovery.
      </Text>

      <NeoCard title="Threshold (M)">
        <Text style={styles.desc}>
          Minimum shares needed to reconstruct the secret.
        </Text>
        <View style={styles.stepperRow}>
          <Pressable
            onPress={() => canDecThreshold && setThreshold(threshold - 1)}
            style={[
              styles.stepperBtn,
              { backgroundColor: canDecThreshold ? highlight : '#E0E0E0' },
            ]}
          >
            <Text style={styles.stepperBtnText}>-</Text>
          </Pressable>
          <View style={styles.stepperValue}>
            <Text style={styles.stepperValueText}>{threshold}</Text>
          </View>
          <Pressable
            onPress={() => canIncThreshold && setThreshold(threshold + 1)}
            style={[
              styles.stepperBtn,
              { backgroundColor: canIncThreshold ? highlight : '#E0E0E0' },
            ]}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </Pressable>
        </View>
      </NeoCard>

      <NeoCard title="Total Shares (N)" style={{ marginTop: 16 }}>
        <Text style={styles.desc}>
          Total number of shares to generate.
        </Text>
        <View style={styles.stepperRow}>
          <Pressable
            onPress={() => canDecShares && setTotalShares(totalShares - 1)}
            style={[
              styles.stepperBtn,
              { backgroundColor: canDecShares ? highlight : '#E0E0E0' },
            ]}
          >
            <Text style={styles.stepperBtnText}>-</Text>
          </Pressable>
          <View style={styles.stepperValue}>
            <Text style={styles.stepperValueText}>{totalShares}</Text>
          </View>
          <Pressable
            onPress={() => canIncShares && setTotalShares(totalShares + 1)}
            style={[
              styles.stepperBtn,
              { backgroundColor: canIncShares ? highlight : '#E0E0E0' },
            ]}
          >
            <Text style={styles.stepperBtnText}>+</Text>
          </Pressable>
        </View>
      </NeoCard>

      <NeoCard title="Summary" style={{ marginTop: 16 }}>
        <View style={[styles.summaryBox, { borderColor: highlight }]}>
          <Text style={styles.summaryText}>
            Any{' '}
            <Text style={[styles.summaryHighlight, { color: highlight }]}>
              {threshold}
            </Text>{' '}
            of{' '}
            <Text style={[styles.summaryHighlight, { color: highlight }]}>
              {totalShares}
            </Text>{' '}
            shares needed to recover
          </Text>
        </View>
      </NeoCard>

      <NeoButton
        title="Continue"
        onPress={handleContinue}
        style={{ marginTop: 24 }}
      />
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
  desc: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 24,
    color: NEO.text,
  },
  stepperValue: {
    width: 64,
    height: 48,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
  stepperValueText: {
    fontFamily: NEO.fontMono,
    fontSize: 28,
    color: NEO.text,
  },
  summaryBox: {
    borderWidth: 2,
    padding: 16,
    alignItems: 'center',
  },
  summaryText: {
    fontFamily: NEO.fontUI,
    fontSize: 16,
    color: NEO.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryHighlight: {
    fontFamily: NEO.fontUIBold,
    fontSize: 20,
  },
});
