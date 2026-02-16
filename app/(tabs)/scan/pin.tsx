import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Buffer } from 'buffer';
import { router } from 'expo-router';
import { NeoButton, NeoCard, NeoInput } from '../../../components/neo';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useScanFlow } from '../../../hooks/useScanFlow';
import { combine } from '../../../lib/shamir';
import { decrypt, deriveKey } from '../../../lib/crypto';
import { validateMnemonic } from '../../../lib/wallet';

export default function PinScreen() {
  const { highlight } = useTheme();
  const { state, update } = useScanFlow();
  const { shares } = state;

  const [pin, setPin] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPIN = shares.length > 0 && shares[0].hasPIN;
  const hasPassphrase = shares.length > 0 && shares[0].hasPassphrase;

  const handleReconstruct = useCallback(async () => {
    if (hasPIN && !pin.trim()) {
      setError('PIN is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Extract raw share buffers from the payloads
      const shareBuffers: Buffer[] = shares.map(s =>
        Buffer.from('0' + s.shareData, 'hex')
      );

      // Combine shares to recover the secret
      const recovered = combine(shareBuffers);
      let mnemonic = recovered.toString();

      // If PIN-protected, decrypt the recovered data
      if (hasPIN && pin.trim()) {
        // The recovered data is an encrypted string; derive key from PIN and decrypt
        const salt = shares[0].id; // Use secret ID as salt (matches generation)
        const key = await deriveKey(pin.trim(), salt);
        mnemonic = await decrypt(mnemonic, key);
      }

      // Clean up the mnemonic
      mnemonic = mnemonic.trim();

      // Validate the mnemonic
      if (!validateMnemonic(mnemonic)) {
        setError('Reconstruction failed - invalid mnemonic. Check your PIN and try again.');
        setLoading(false);
        return;
      }

      // Store recovered data in scan flow context
      const firstShare = shares[0];
      update({
        recoveredMnemonic: mnemonic,
        name: firstShare.name,
        pathType: firstShare.pathType,
        wordCount: firstShare.wordCount,
        derivationPath: firstShare.derivationPath,
        hasPIN: firstShare.hasPIN,
        hasPassphrase: firstShare.hasPassphrase,
      });

      router.replace('/(tabs)/scan/result');
    } catch (err) {
      console.error('Reconstruction error:', err);
      setError(
        err instanceof Error
          ? `Reconstruction failed: ${err.message}`
          : 'Failed to reconstruct secret. Verify your PIN is correct.'
      );
    } finally {
      setLoading(false);
    }
  }, [shares, pin, passphrase, hasPIN, update]);

  if (shares.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <NeoCard title="Error">
          <Text style={styles.text}>No shares available. Go back and scan shares first.</Text>
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
      <Text style={styles.heading}>Unlock Secret</Text>
      <Text style={styles.subtitle}>
        {shares.length} shares scanned for "{shares[0].name}".
        Enter your credentials to reconstruct the mnemonic.
      </Text>

      <NeoCard title="Credentials">
        {hasPIN && (
          <NeoInput
            label="PIN"
            value={pin}
            onChangeText={setPin}
            placeholder="Enter your PIN"
            keyboardType="number-pad"
            secureTextEntry
            mono
            containerStyle={styles.inputContainer}
          />
        )}

        {hasPassphrase && (
          <NeoInput
            label="Passphrase"
            value={passphrase}
            onChangeText={setPassphrase}
            placeholder="Enter your passphrase"
            secureTextEntry
            containerStyle={styles.inputContainer}
          />
        )}

        {!hasPIN && !hasPassphrase && (
          <Text style={styles.text}>
            No PIN or passphrase required. Press Reconstruct to proceed.
          </Text>
        )}
      </NeoCard>

      {/* Share summary */}
      <NeoCard title="Shares" style={{ marginTop: 16 }}>
        {shares.map(s => (
          <View key={s.shareIndex} style={styles.shareRow}>
            <Text style={styles.shareIndex}>#{s.shareIndex}</Text>
            <Text style={styles.shareInfo}>
              Share {s.shareIndex} of {s.totalShares}
            </Text>
          </View>
        ))}
      </NeoCard>

      {/* Error display */}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Reconstruct button */}
      <NeoButton
        title={loading ? 'Reconstructing...' : 'Reconstruct'}
        onPress={handleReconstruct}
        disabled={loading || (hasPIN && !pin.trim())}
        style={{ marginTop: 24 }}
      />

      {loading && (
        <ActivityIndicator
          size="large"
          color={highlight}
          style={{ marginTop: 16 }}
        />
      )}

      <NeoButton
        title="Cancel"
        variant="secondary"
        onPress={() => router.back()}
        style={{ marginTop: 12 }}
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
  text: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: NEO.text,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  shareIndex: {
    fontFamily: NEO.fontMono,
    fontSize: 14,
    color: '#999',
    width: 32,
  },
  shareInfo: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: NEO.text,
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
});
