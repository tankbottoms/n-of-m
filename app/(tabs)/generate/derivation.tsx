import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { NeoButton, NeoCard } from '../../../components/neo';
import { AddressRow } from '../../../components/AddressRow';
import { PathEditor } from '../../../components/PathEditor';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useGenerateFlow } from '../../../hooks/useGenerateFlow';
import { deriveAddresses } from '../../../lib/wallet';
import { DERIVATION_PATHS, getDerivationPath } from '../../../constants/derivation';
import { PathType, DerivedAddress } from '../../../constants/types';

const PATH_TYPES: PathType[] = ['metamask', 'ledger', 'custom'];
const ADDRESS_COUNTS = [5, 10, 20] as const;

export default function DerivationScreen() {
  const { highlight } = useTheme();
  const { state, update } = useGenerateFlow();
  const mnemonic = state.mnemonic;

  const [pathType, setPathType] = useState<PathType>('custom');
  const [customPath, setCustomPath] = useState(state.customPath ?? "m/44'/60'/0'/0/{index}");
  const [addressCount, setAddressCount] = useState<number>(state.addressCount);
  const [addresses, setAddresses] = useState<DerivedAddress[]>([]);
  const [derived, setDerived] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinnedIndices, setPinnedIndices] = useState<Set<number>>(new Set());

  const resolvedPath =
    pathType === 'custom'
      ? customPath.replace('{index}', '0')
      : DERIVATION_PATHS[pathType].template.replace('{index}', '0');

  const handlePathEdit = useCallback(
    (newPath: string) => {
      // When user edits path segments, switch to custom and rebuild template
      // Replace the trailing number with {index} for the template
      const parts = newPath.split('/');
      const lastPart = parts[parts.length - 1];
      const hardened = lastPart.endsWith("'");
      const base = parts.slice(0, -1).join('/');
      const template = base + '/{index}' + (hardened ? "'" : '');
      setCustomPath(template);
      if (pathType !== 'custom') {
        setPathType('custom');
      }
      setDerived(false);
      setAddresses([]);
    },
    [pathType]
  );

  const handlePathTypeChange = useCallback(
    (pt: PathType) => {
      setPathType(pt);
      if (pt !== 'custom') {
        setCustomPath(DERIVATION_PATHS[pt].template);
      }
      setDerived(false);
      setAddresses([]);
    },
    []
  );

  const handleTogglePin = useCallback((addrIndex: number) => {
    setPinnedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(addrIndex)) {
        next.delete(addrIndex);
      } else {
        next.add(addrIndex);
      }
      return next;
    });
  }, []);

  const handleDerive = useCallback(() => {
    if (!mnemonic) return;
    setLoading(true);
    setTimeout(() => {
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
        if (__DEV__) console.error('Derivation error:', err);
      }
      setLoading(false);
    }, 50);
  }, [mnemonic, pathType, addressCount, customPath]);

  const handleContinue = useCallback(() => {
    update({
      pathType,
      customPath: pathType === 'custom' ? customPath : undefined,
      addressCount,
      pinnedAddresses: Array.from(pinnedIndices),
    });
    router.push({ pathname: '/(tabs)/generate/shamir' });
  }, [pathType, customPath, addressCount, pinnedIndices, update]);

  const currentPathInfo = DERIVATION_PATHS[pathType];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Derivation Path</Text>
      <PathEditor
        path={resolvedPath}
        onChange={handlePathEdit}
        pathType={pathType}
        showLabel
      />
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
              onPress={() => handlePathTypeChange(pt)}
              style={styles.pathBtn}
            />
          ))}
        </View>
        <Text style={styles.pathDesc}>{currentPathInfo.description}</Text>
      </NeoCard>

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

      <View style={{ marginTop: 16 }}>
        <NeoButton
          title={loading ? 'Deriving...' : 'Derive Addresses'}
          onPress={handleDerive}
          disabled={loading}
        />
        {loading && (
          <ActivityIndicator size="small" color={highlight} style={{ position: 'absolute', right: 16, top: 14 }} />
        )}
      </View>

      {derived && addresses.length > 0 && (
        <View style={styles.addressSection}>
          <NeoCard title={`${addresses.length} Addresses`}>
            {addresses.map((addr) => {
              const fullPath = pathType === 'custom'
                ? customPath.replace('{index}', String(addr.index))
                : DERIVATION_PATHS[pathType].template.replace('{index}', String(addr.index));
              return (
                <View key={addr.index}>
                  <Text style={styles.addrPathText}>{fullPath}</Text>
                  <AddressRow
                    address={addr}
                    pinned={pinnedIndices.has(addr.index)}
                    onTogglePin={() => handleTogglePin(addr.index)}
                  />
                </View>
              );
            })}
            <View style={{ marginTop: 16 }}>
              <Text style={styles.pathDesc}>Generate more:</Text>
              <View style={[styles.row, { marginTop: 8 }]}>
                {[5, 10, 20].map((n) => (
                  <NeoButton
                    key={n}
                    title={`+${n}`}
                    size="sm"
                    variant="secondary"
                    onPress={() => {
                      if (!mnemonic) return;
                      try {
                        const newTotal = addresses.length + n;
                        const result = deriveAddresses(
                          mnemonic,
                          pathType,
                          newTotal,
                          pathType === 'custom' ? customPath : undefined
                        );
                        setAddresses(result);
                      } catch (err) {
                        if (__DEV__) console.error('Derivation error:', err);
                      }
                    }}
                    style={styles.countBtn}
                  />
                ))}
              </View>
            </View>
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
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    marginTop: 12,
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
  addrPathText: {
    fontFamily: NEO.fontMono,
    fontSize: 11,
    color: '#999',
    marginTop: 8,
    marginBottom: 2,
  },
});
