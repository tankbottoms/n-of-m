import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { NeoButton, NeoCard, NeoInput } from '../../../components/neo';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';

export default function MetadataScreen() {
  const { highlight } = useTheme();
  const params = useLocalSearchParams<{
    mnemonic: string;
    threshold: string;
    totalShares: string;
  }>();

  const mnemonic = params.mnemonic ?? '';
  const threshold = parseInt(params.threshold ?? '3', 10);
  const totalShares = parseInt(params.totalShares ?? '5', 10);

  const [name, setName] = useState('');
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [passphraseEnabled, setPassphraseEnabled] = useState(false);
  const [passphrase, setPassphrase] = useState('');

  const nameValid = name.trim().length > 0;
  const pinValid = !pinEnabled || (pin.length >= 4 && pin.length <= 8);
  const canContinue = nameValid && pinValid;

  const handleGenerate = useCallback(() => {
    // For now, navigate to a future preview screen or back to index
    // The actual SSS split and SharePayload creation will be wired
    // in the integration phase.
    //
    // Collect all config for eventual use:
    const config = {
      mnemonic,
      threshold,
      totalShares,
      name: name.trim(),
      hasPIN: pinEnabled,
      pin: pinEnabled ? pin : undefined,
      hasPassphrase: passphraseEnabled,
      passphrase: passphraseEnabled ? passphrase : undefined,
    };

    console.log('Generate config:', JSON.stringify(config, null, 2));

    // Navigate back to generate index for now
    router.push('/(tabs)/generate/');
  }, [mnemonic, threshold, totalShares, name, pinEnabled, pin, passphraseEnabled, passphrase]);

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
            {threshold} of {totalShares}
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

      <NeoButton
        title="Generate Shares"
        onPress={handleGenerate}
        disabled={!canContinue}
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
});
