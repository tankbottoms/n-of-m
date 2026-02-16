import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Buffer } from 'buffer';
import { v4 as uuid } from 'uuid';
import { NeoButton, NeoCard, NeoInput } from '../../../components/neo';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useGenerateFlow } from '../../../hooks/useGenerateFlow';
import { split } from '../../../lib/shamir';
import { encrypt, deriveKey } from '../../../lib/crypto';
import { getBasePath } from '../../../constants/derivation';
import { SharePayload } from '../../../constants/types';

export default function MetadataScreen() {
  const { highlight } = useTheme();
  const { state, update } = useGenerateFlow();

  const [name, setName] = useState(state.name || '');
  const [pinEnabled, setPinEnabled] = useState(!!state.pin);
  const [pin, setPin] = useState(state.pin || '');
  const [passphraseEnabled, setPassphraseEnabled] = useState(!!state.passphrase);
  const [passphrase, setPassphrase] = useState(state.passphrase || '');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameValid = name.trim().length > 0;
  const pinValid = !pinEnabled || (pin.length >= 4 && pin.length <= 8);
  const canContinue = nameValid && pinValid && !generating;

  const handleGenerate = useCallback(async () => {
    if (!state.mnemonic) {
      setError('No mnemonic available. Go back and generate one first.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const secretId = uuid();
      let secretData = state.mnemonic;

      // If PIN enabled, encrypt the mnemonic
      if (pinEnabled && pin) {
        const key = await deriveKey(pin, secretId);
        secretData = await encrypt(state.mnemonic, key);
      }

      // Split the secret data into shares
      const secretBuffer = Buffer.from(secretData);
      const shares = split(secretBuffer, {
        shares: state.totalShares,
        threshold: state.threshold,
      });

      // Build SharePayload for each share
      const derivationPath = getBasePath(state.pathType, state.customPath);
      const sharePayloads: SharePayload[] = shares.map((shareBuf, i) => ({
        v: 1 as const,
        id: secretId,
        name: name.trim(),
        shareIndex: i + 1,
        totalShares: state.totalShares,
        threshold: state.threshold,
        shareData: shareBuf.toString('hex'),
        derivationPath,
        pathType: state.pathType,
        wordCount: state.wordCount,
        metadata: state.metadata,
        hasPIN: pinEnabled,
        hasPassphrase: passphraseEnabled,
      }));

      // Update flow context
      update({
        name: name.trim(),
        pin: pinEnabled ? pin : undefined,
        passphrase: passphraseEnabled ? passphrase : undefined,
        shares: sharePayloads,
      });

      // Navigate to preview screen
      router.push('/(tabs)/generate/preview');
    } catch (err) {
      console.error('Generate shares error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate shares');
    } finally {
      setGenerating(false);
    }
  }, [state, name, pinEnabled, pin, passphraseEnabled, passphrase, update]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Metadata</Text>
      <Text style={styles.subtitle}>
        Add a label and optional security features before generating shares.
      </Text>

      <NeoCard title="Secret Name">
        <NeoInput
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Main Wallet, Cold Storage"
        />
      </NeoCard>

      <NeoCard title="PIN Protection" style={{ marginTop: 16 }}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable PIN encryption</Text>
          <Switch
            value={pinEnabled}
            onValueChange={setPinEnabled}
            trackColor={{ false: '#DDD', true: highlight }}
            thumbColor={NEO.bg}
          />
        </View>
        {pinEnabled && (
          <View style={{ marginTop: 12 }}>
            <NeoInput
              label="PIN (4-8 digits)"
              value={pin}
              onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 8))}
              placeholder="Enter PIN"
              keyboardType="number-pad"
              secureTextEntry
              mono
            />
            {pin.length > 0 && pin.length < 4 && (
              <Text style={styles.validationError}>
                PIN must be at least 4 digits
              </Text>
            )}
          </View>
        )}
      </NeoCard>

      <NeoCard title="BIP39 Passphrase" style={{ marginTop: 16 }}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Enable passphrase</Text>
          <Switch
            value={passphraseEnabled}
            onValueChange={setPassphraseEnabled}
            trackColor={{ false: '#DDD', true: highlight }}
            thumbColor={NEO.bg}
          />
        </View>
        {passphraseEnabled && (
          <View style={{ marginTop: 12 }}>
            <NeoInput
              label="Passphrase"
              value={passphrase}
              onChangeText={setPassphrase}
              placeholder="Enter BIP39 passphrase"
              secureTextEntry
              mono
            />
            <Text style={styles.warning}>
              This passphrase creates a completely different wallet. If forgotten, funds cannot be recovered.
            </Text>
          </View>
        )}
      </NeoCard>

      <NeoCard title="Summary" style={{ marginTop: 16 }}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Name</Text>
          <Text style={styles.summaryValue}>{name || '--'}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shamir</Text>
          <Text style={styles.summaryValue}>
            {state.threshold} of {state.totalShares}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>PIN</Text>
          <Text style={styles.summaryValue}>
            {pinEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Passphrase</Text>
          <Text style={styles.summaryValue}>
            {passphraseEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      </NeoCard>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <NeoButton
        title={generating ? 'Generating...' : 'Generate Shares'}
        onPress={handleGenerate}
        disabled={!canContinue}
        style={{ marginTop: 24 }}
      />

      {generating && (
        <ActivityIndicator
          size="large"
          color={highlight}
          style={{ marginTop: 16 }}
        />
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: NEO.text,
  },
  validationError: {
    fontFamily: NEO.fontUI,
    fontSize: 12,
    color: '#CC0000',
    marginTop: 4,
  },
  warning: {
    fontFamily: NEO.fontUI,
    fontSize: 12,
    color: '#CC6600',
    marginTop: 8,
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  summaryLabel: {
    fontFamily: NEO.fontUIBold,
    fontSize: 14,
    color: '#666',
    textTransform: 'uppercase',
  },
  summaryValue: {
    fontFamily: NEO.fontMono,
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
