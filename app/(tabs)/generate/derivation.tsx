import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { NeoButton, NeoCard, NeoInput } from '../../../components/neo';
import { AddressRow } from '../../../components/AddressRow';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useGenerateFlow } from '../../../hooks/useGenerateFlow';
import { deriveAddresses } from '../../../lib/wallet';
import { DERIVATION_PATHS } from '../../../constants/derivation';
import { PathType, DerivedAddress } from '../../../constants/types';

const PATH_TYPES: PathType[] = ['metamask', 'ledger', 'custom'];
const ADDRESS_COUNTS = [5, 10, 20] as const;

export default function DerivationScreen() {
  const { highlight } = useTheme();
  const { state, update } = useGenerateFlow();
  const mnemonic = state.mnemonic;

  const [pathType, setPathType] = useState<PathType>(state.pathType);
  const [customPath, setCustomPath] = useState(state.customPath ?? "m/44'/60'/0'/0/{index}");
  const [addressCount, setAddressCount] = useState<number>(state.addressCount);
  const [addresses, setAddresses] = useState<DerivedAddress[]>([]);
  const [derived, setDerived] = useState(false);

  const handleDerive = useCallback(() => {
    if (!mnemonic) return;
    try {
      const result = deriveAddresses(
        mnemonic,
        pathType,
        addressCount,
        pathType === 'custom' ? customPath : undefined
      );
      setAddresses(result);
      setDerived(true);
    } catch (err) {
      console.error('Derivation error:', err);
    }
  }, [mnemonic, pathType, addressCount, customPath]);

  const handleContinue = useCallback(() => {
    update({
      pathType,
      customPath: pathType === 'custom' ? customPath : undefined,
      addressCount,
    });
    router.push({ pathname: '/(tabs)/generate/shamir' });
  }, [pathType, customPath, addressCount, update]);

  const currentPathInfo = DERIVATION_PATHS[pathType];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Derivation</Text>
      <Text style={styles.subtitle}>
        Choose a derivation path and generate addresses from your seed phrase.
      </Text>

      <NeoCard title="Path Type">
        <View style={styles.row}>
          {PATH_TYPES.map((pt) => (
            <NeoButton
              key={pt}
              title={DERIVATION_PATHS[pt].label}
              size="sm"
              variant={pathType === pt ? 'primary' : 'secondary'}
              onPress={() => {
                setPathType(pt);
                setDerived(false);
                setAddresses([]);
              }}
              style={styles.pathBtn}
            />
          ))}
        </View>
        <Text style={styles.pathDesc}>{currentPathInfo.description}</Text>
        {pathType !== 'custom' && (
          <Text style={styles.pathTemplate}>{currentPathInfo.template}</Text>
        )}
      </NeoCard>

      {pathType === 'custom' && (
        <NeoInput
          label="Custom Path"
          value={customPath}
          onChangeText={(text) => {
            setCustomPath(text);
            setDerived(false);
            setAddresses([]);
          }}
          placeholder="m/44'/60'/0'/0/{index}"
          mono
          containerStyle={{ marginTop: 12 }}
        />
      )}

      <NeoCard title="Address Count" style={{ marginTop: 16 }}>
        <View style={styles.row}>
          {ADDRESS_COUNTS.map((count) => (
            <NeoButton
              key={count}
              title={String(count)}
              size="sm"
              variant={addressCount === count ? 'primary' : 'secondary'}
              onPress={() => {
                setAddressCount(count);
                setDerived(false);
                setAddresses([]);
              }}
              style={styles.countBtn}
            />
          ))}
        </View>
      </NeoCard>

      <NeoButton
        title="Derive Addresses"
        onPress={handleDerive}
        style={{ marginTop: 16 }}
      />

      {derived && addresses.length > 0 && (
        <View style={styles.addressSection}>
          <NeoCard title={`${addresses.length} Addresses`}>
            {addresses.map((addr) => (
              <AddressRow key={addr.index} address={addr} />
            ))}
          </NeoCard>

          <NeoButton
            title="Continue to Shamir"
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pathBtn: { minWidth: 80 },
  pathDesc: {
    fontFamily: NEO.fontUI,
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    lineHeight: 18,
  },
  pathTemplate: {
    fontFamily: NEO.fontMono,
    fontSize: 13,
    color: NEO.text,
    marginTop: 4,
  },
  countBtn: { minWidth: 50 },
  addressSection: { marginTop: 20 },
});
