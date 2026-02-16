import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { NeoButton, NeoCard, NeoBadge } from '../../../components/neo';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useGenerateFlow } from '../../../hooks/useGenerateFlow';
import { sharePDF } from '../../../lib/pdf/generate';
import { useVault } from '../../../hooks/useVault';
import { SecretRecord } from '../../../constants/types';
import { v4 as uuid } from 'uuid';

export default function ShareScreen() {
  const { highlight } = useTheme();
  const { state, reset } = useGenerateFlow();
  const { save } = useVault();
  const { pdfUri, shares, name, mnemonic, wordCount, pathType, threshold, totalShares } = state;

  const [shared, setShared] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    if (!pdfUri) return;
    try {
      await sharePDF(pdfUri);
      setShared(true);
    } catch (err) {
      console.error('Share error:', err);
    }
  }, [pdfUri]);

  const handleSaveToVault = useCallback(async () => {
    setSaveError(null);
    try {
      const record: SecretRecord = {
        id: uuid(),
        name: name || 'Untitled',
        createdAt: Date.now(),
        mnemonic,
        wordCount,
        derivationPath: pathType === 'metamask'
          ? "m/44'/60'/0'/0"
          : pathType === 'ledger'
            ? "m/44'/60'/0'"
            : state.customPath || "m/44'/60'/0'/0",
        pathType,
        addressCount: state.addressCount,
        addresses: [],
        shamirConfig: { threshold, totalShares },
        metadata: state.metadata,
        hasPassphrase: !!state.passphrase,
        hasPIN: !!state.pin,
      };
      await save(record);
      setSaved(true);
    } catch (err) {
      console.error('Save to vault error:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    }
  }, [name, mnemonic, wordCount, pathType, threshold, totalShares, state, save]);

  const handleDone = useCallback(() => {
    reset();
    router.replace('/(tabs)/generate');
  }, [reset]);

  if (!pdfUri) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Share</Text>
        <NeoCard title="No PDF">
          <Text style={styles.bodyText}>
            No PDF has been generated yet. Go back to the preview screen to generate one.
          </Text>
          <NeoButton
            title="Go Back"
            onPress={() => router.back()}
            variant="secondary"
            style={{ marginTop: 16 }}
          />
        </NeoCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Share</Text>
      <Text style={styles.subtitle}>
        Your PDF with {shares.length} Shamir share cards has been generated.
      </Text>

      {/* Success card */}
      <NeoCard title="PDF Ready">
        <View style={styles.successRow}>
          <NeoBadge text="[DONE]" variant="highlight" />
          <Text style={styles.successText}>
            {shares.length} share cards generated
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Name</Text>
          <Text style={styles.infoValue}>{name || 'Untitled'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Scheme</Text>
          <Text style={styles.infoValue}>{threshold} of {totalShares}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Format</Text>
          <Text style={styles.infoValue}>PDF</Text>
        </View>
      </NeoCard>

      {/* Share PDF button */}
      <NeoButton
        title={shared ? 'Shared' : 'Share PDF'}
        onPress={handleShare}
        style={{ marginTop: 16 }}
        variant={shared ? 'secondary' : 'primary'}
      />

      {/* Save to vault */}
      <NeoButton
        title={saved ? 'Saved to Vault' : 'Save to Vault'}
        onPress={handleSaveToVault}
        disabled={saved}
        variant={saved ? 'secondary' : 'primary'}
        style={{ marginTop: 12 }}
      />

      {saveError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{saveError}</Text>
        </View>
      )}

      {/* Done button */}
      <NeoButton
        title="Done"
        onPress={handleDone}
        variant="secondary"
        style={{ marginTop: 24 }}
      />

      <Text style={styles.warningText}>
        Make sure you have securely distributed or stored the share cards before leaving this screen.
        Share data cannot be recovered once you navigate away.
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
  bodyText: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  successText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 15,
    color: NEO.text,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  infoLabel: {
    fontFamily: NEO.fontUIBold,
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontFamily: NEO.fontMono,
    fontSize: 14,
    color: NEO.text,
  },
  errorBox: {
    borderWidth: 2,
    borderColor: '#CC0000',
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: '#CC0000',
    lineHeight: 20,
  },
  warningText: {
    fontFamily: NEO.fontUI,
    fontSize: 12,
    color: '#CC6600',
    marginTop: 20,
    lineHeight: 18,
    textAlign: 'center',
  },
});
