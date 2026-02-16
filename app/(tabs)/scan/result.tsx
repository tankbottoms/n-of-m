import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Buffer } from 'buffer';
import { router } from 'expo-router';
import * as ExpoCrypto from 'expo-crypto';
import { NeoButton, NeoCard, NeoBadge } from '../../../components/neo';
import { MnemonicGrid } from '../../../components/MnemonicGrid';
import { AddressRow } from '../../../components/AddressRow';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useScanFlow } from '../../../hooks/useScanFlow';
import { useVault } from '../../../hooks/useVault';
import { combine } from '../../../lib/shamir';
import { validateMnemonic, deriveAddresses } from '../../../lib/wallet';
import { DerivedAddress, SecretRecord } from '../../../constants/types';
import { DERIVATION_PATHS, getBasePath } from '../../../constants/derivation';

export default function ResultScreen() {
  const { highlight } = useTheme();
  const { state, update, reset } = useScanFlow();
  const { save } = useVault();

  const [revealed, setRevealed] = useState(false);
  const [addresses, setAddresses] = useState<DerivedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If we arrive here without a mnemonic (no PIN required path), reconstruct now
  useEffect(() => {
    async function reconstruct() {
      try {
        let mnemonic = state.recoveredMnemonic;

        // If no mnemonic yet, reconstruct from shares directly (no PIN case)
        if (!mnemonic && state.shares.length > 0) {
          const shareBuffers: Buffer[] = state.shares.map(s =>
            Buffer.from('0' + s.shareData, 'hex')
          );
          const recovered = combine(shareBuffers);
          mnemonic = recovered.toString().trim();

          if (!validateMnemonic(mnemonic)) {
            setError('Reconstruction failed - invalid mnemonic recovered.');
            setLoading(false);
            return;
          }

          const firstShare = state.shares[0];
          update({
            recoveredMnemonic: mnemonic,
            name: firstShare.name,
            pathType: firstShare.pathType,
            wordCount: firstShare.wordCount,
            derivationPath: firstShare.derivationPath,
            hasPIN: firstShare.hasPIN,
            hasPassphrase: firstShare.hasPassphrase,
          });
        }

        if (!mnemonic) {
          setError('No mnemonic available. Please go back and try again.');
          setLoading(false);
          return;
        }

        // Derive addresses
        const pathType = state.pathType ?? state.shares[0]?.pathType ?? 'metamask';
        const derived = deriveAddresses(mnemonic, pathType, 5);
        setAddresses(derived);
        update({ addresses: derived });
        setLoading(false);
      } catch (err) {
        console.error('Result reconstruction error:', err);
        setError(err instanceof Error ? err.message : 'Failed to process recovered secret');
        setLoading(false);
      }
    }

    reconstruct();
  }, []); // Run once on mount

  const handleSaveToVault = useCallback(async () => {
    if (!state.recoveredMnemonic) return;

    setSaving(true);
    setError(null);

    try {
      const pathType = state.pathType ?? 'metamask';
      const wordCount = state.wordCount ?? 24;
      const derivationPath = state.derivationPath ?? getBasePath(pathType);
      const derivedAddresses = addresses.length > 0
        ? addresses
        : deriveAddresses(state.recoveredMnemonic, pathType, 10);

      const record: SecretRecord = {
        id: state.shares[0]?.id ?? ExpoCrypto.randomUUID(),
        name: state.name ?? 'Recovered Secret',
        createdAt: Date.now(),
        mnemonic: state.recoveredMnemonic,
        wordCount,
        derivationPath,
        pathType,
        addressCount: derivedAddresses.length,
        addresses: derivedAddresses,
        shamirConfig: {
          threshold: state.shares[0]?.threshold ?? 0,
          totalShares: state.shares[0]?.totalShares ?? 0,
        },
        hasPassphrase: state.hasPassphrase ?? false,
        hasPIN: state.hasPIN ?? false,
      };

      await save(record);
      setSaved(true);
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save to vault');
    } finally {
      setSaving(false);
    }
  }, [state, addresses, save]);

  const handleDone = useCallback(() => {
    reset();
    router.replace('/(tabs)/scan');
  }, [reset]);

  const mnemonic = state.recoveredMnemonic;
  const words = mnemonic ? mnemonic.split(' ') : [];
  const name = state.name ?? state.shares[0]?.name ?? 'Unknown';
  const pathType = state.pathType ?? state.shares[0]?.pathType ?? 'metamask';
  const pathLabel = DERIVATION_PATHS[pathType]?.label ?? pathType;
  const wordCount = state.wordCount ?? state.shares[0]?.wordCount ?? words.length;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={highlight} />
        <Text style={[styles.text, { marginTop: 16 }]}>Reconstructing secret...</Text>
      </View>
    );
  }

  if (error && !mnemonic) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <NeoCard title="Error">
          <Text style={styles.errorText}>{error}</Text>
          <NeoButton
            title="Go Back"
            variant="secondary"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </NeoCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Secret Recovered</Text>
      <Text style={styles.subtitle}>
        Your mnemonic has been successfully reconstructed from the scanned shares.
      </Text>

      {/* Summary card */}
      <NeoCard title={name}>
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>WORDS</Text>
            <NeoBadge text={String(wordCount)} variant="highlight" />
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>PATH</Text>
            <NeoBadge text={pathLabel} variant="outline" />
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>SHARES</Text>
            <NeoBadge
              text={`${state.shares.length} of ${state.shares[0]?.totalShares ?? '?'}`}
              variant="outline"
            />
          </View>
        </View>
      </NeoCard>

      {/* Mnemonic grid */}
      <NeoCard title="Mnemonic" style={{ marginTop: 16 }}>
        <MnemonicGrid
          words={words}
          revealed={revealed}
          onToggleReveal={() => setRevealed(!revealed)}
        />
      </NeoCard>

      {/* Derived addresses */}
      {addresses.length > 0 && (
        <NeoCard title="Derived Addresses" style={{ marginTop: 16 }}>
          <Text style={styles.pathInfo}>
            {DERIVATION_PATHS[pathType]?.description ?? pathType}
          </Text>
          <View style={{ marginTop: 12 }}>
            {addresses.map(addr => (
              <AddressRow key={addr.index} address={addr} />
            ))}
          </View>
        </NeoCard>
      )}

      {/* Error display */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {!saved ? (
          <NeoButton
            title={saving ? 'Saving...' : 'Save to Vault'}
            onPress={handleSaveToVault}
            disabled={saving || !mnemonic}
            style={{ marginBottom: 12 }}
          />
        ) : (
          <View style={[styles.savedBanner, { backgroundColor: highlight }]}>
            <Text style={styles.savedText}>Saved to vault</Text>
          </View>
        )}

        <NeoButton
          title="Done"
          variant="secondary"
          onPress={handleDone}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg },
  content: { padding: 16, paddingBottom: 40 },
  centered: { justifyContent: 'center', alignItems: 'center' },
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
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metaItem: {
    gap: 4,
  },
  metaLabel: {
    fontFamily: NEO.fontUIBold,
    fontSize: 11,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pathInfo: {
    fontFamily: NEO.fontUI,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
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
  actions: {
    marginTop: 24,
  },
  savedBanner: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    alignItems: 'center',
    marginBottom: 12,
  },
  savedText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 16,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
