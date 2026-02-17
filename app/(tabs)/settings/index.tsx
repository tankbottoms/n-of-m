import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { NeoCard, NeoButton, NeoInput, NeoBadge } from '../../../components/neo';

const TEST_MODE = process.env.EXPO_PUBLIC_TEST_MODE === 'true';
import { PathEditor } from '../../../components/PathEditor';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { setPIN, hasPIN } from '../../../lib/storage/keys';

const VAULT_AUTH_KEY = 'shamir_vault_auth_required';
import {
  DEFAULT_WORD_COUNT,
  DEFAULT_ADDRESS_COUNT,
  DEFAULT_PATH_TYPE,
  DERIVATION_PATHS,
} from '../../../constants/derivation';
import { WordCount, PathType } from '../../../constants/types';

const WORD_OPTIONS: WordCount[] = [12, 15, 18, 21, 24];
const ADDRESS_OPTIONS = [5, 10, 20];
const PATH_OPTIONS: PathType[] = ['metamask', 'ledger', 'custom'];

const STORE_WORD_COUNT = 'shamir_default_word_count';
const STORE_ADDR_COUNT = 'shamir_default_addr_count';
const STORE_PATH_TYPE = 'shamir_default_path_type';
export const STORE_DEFAULT_PATH = 'shamir_default_derivation_path';

export default function SettingsScreen() {
  const { highlight } = useTheme();

  // PIN state
  const [pinSet, setPinSet] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [pinError, setPinError] = useState('');

  // Vault auth state
  const [vaultAuthRequired, setVaultAuthRequired] = useState(false);

  // Defaults state
  const [wordCount, setWordCount] = useState<WordCount>(DEFAULT_WORD_COUNT);
  const [addressCount, setAddressCount] = useState(DEFAULT_ADDRESS_COUNT);
  const [pathType, setPathType] = useState<PathType>(DEFAULT_PATH_TYPE);
  const [defaultPath, setDefaultPath] = useState("m/44'/60'/0'/0/0");

  useEffect(() => {
    hasPIN().then(setPinSet);
    SecureStore.getItemAsync(VAULT_AUTH_KEY).then((v) => {
      setVaultAuthRequired(v === 'true');
    });
    SecureStore.getItemAsync(STORE_WORD_COUNT).then((v) => {
      if (v) setWordCount(Number(v) as WordCount);
    });
    SecureStore.getItemAsync(STORE_ADDR_COUNT).then((v) => {
      if (v) setAddressCount(Number(v));
    });
    SecureStore.getItemAsync(STORE_PATH_TYPE).then((v) => {
      if (v) setPathType(v as PathType);
    });
    SecureStore.getItemAsync(STORE_DEFAULT_PATH).then((v) => {
      if (v) setDefaultPath(v);
    });
  }, []);

  const handleSetPIN = useCallback(async () => {
    setPinError('');
    if (pin1.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    if (pin1 !== pin2) {
      setPinError('PINs do not match');
      return;
    }
    if (!/^\d+$/.test(pin1)) {
      setPinError('PIN must contain only digits');
      return;
    }
    try {
      await setPIN(pin1);
      setPinSet(true);
      setShowPinForm(false);
      setPin1('');
      setPin2('');
      Alert.alert('PIN Set', 'Your PIN has been saved.');
    } catch {
      setPinError('Failed to save PIN');
    }
  }, [pin1, pin2]);

  const handleWordCount = useCallback(async (wc: WordCount) => {
    setWordCount(wc);
    await SecureStore.setItemAsync(STORE_WORD_COUNT, String(wc));
  }, []);

  const handleAddressCount = useCallback(async (ac: number) => {
    setAddressCount(ac);
    await SecureStore.setItemAsync(STORE_ADDR_COUNT, String(ac));
  }, []);

  const handlePathType = useCallback(async (pt: PathType) => {
    setPathType(pt);
    await SecureStore.setItemAsync(STORE_PATH_TYPE, pt);
    if (pt !== 'custom') {
      const resolved = DERIVATION_PATHS[pt].template.replace('{index}', '0');
      setDefaultPath(resolved);
      await SecureStore.setItemAsync(STORE_DEFAULT_PATH, resolved);
    }
  }, []);

  const handleDefaultPath = useCallback(async (newPath: string) => {
    setDefaultPath(newPath);
    await SecureStore.setItemAsync(STORE_DEFAULT_PATH, newPath);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings</Text>

      {/* PIN Section */}
      <NeoCard title="PIN Protection" style={styles.section}>
        <View style={styles.pinStatus}>
          <Text style={styles.bodyText}>Status: </Text>
          <NeoBadge
            text={pinSet ? 'PIN Set' : 'No PIN'}
            variant={pinSet ? 'highlight' : 'outline'}
          />
        </View>

        {!showPinForm ? (
          <NeoButton
            title={pinSet ? 'Change PIN' : 'Set PIN'}
            variant="secondary"
            size="sm"
            onPress={() => {
              setShowPinForm(true);
              setPinError('');
              setPin1('');
              setPin2('');
            }}
            style={{ marginTop: 12 }}
          />
        ) : (
          <View style={styles.pinForm}>
            <NeoInput
              label="Enter PIN"
              placeholder="Minimum 4 digits"
              keyboardType="number-pad"
              secureTextEntry
              value={pin1}
              onChangeText={setPin1}
              maxLength={8}
              containerStyle={{ marginBottom: 12 }}
            />
            <NeoInput
              label="Confirm PIN"
              placeholder="Re-enter PIN"
              keyboardType="number-pad"
              secureTextEntry
              value={pin2}
              onChangeText={setPin2}
              maxLength={8}
              containerStyle={{ marginBottom: 12 }}
            />
            {pinError !== '' && (
              <Text style={styles.errorText}>{pinError}</Text>
            )}
            <View style={styles.pinActions}>
              <NeoButton
                title="Save PIN"
                size="sm"
                onPress={handleSetPIN}
              />
              <NeoButton
                title="Cancel"
                variant="secondary"
                size="sm"
                onPress={() => {
                  setShowPinForm(false);
                  setPin1('');
                  setPin2('');
                  setPinError('');
                }}
              />
            </View>
          </View>
        )}
      </NeoCard>

      {/* Vault Authentication */}
      <NeoCard title="Vault Access" style={styles.section}>
        <View style={styles.toggleAuthRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bodyText}>Require PIN / FaceID</Text>
            <Text style={styles.authHint}>
              {pinSet
                ? 'Authenticate with PIN or biometrics to view vault'
                : 'Set a PIN first to enable vault protection'}
            </Text>
          </View>
          <Switch
            value={vaultAuthRequired}
            onValueChange={async (val) => {
              if (val && !pinSet) {
                Alert.alert('PIN Required', 'Set a PIN first before enabling vault authentication.');
                return;
              }
              if (val) {
                if (!TEST_MODE) {
                  // Verify identity before enabling
                  const compatible = await LocalAuthentication.hasHardwareAsync();
                  const enrolled = compatible && await LocalAuthentication.isEnrolledAsync();
                  if (enrolled) {
                    const result = await LocalAuthentication.authenticateAsync({
                      promptMessage: 'Verify your identity to enable vault protection',
                      disableDeviceFallback: false,
                    });
                    if (!result.success) {
                      Alert.alert('Authentication Failed', 'Vault protection was not enabled.');
                      return;
                    }
                  }
                }
                // If test mode or no biometrics, PIN is sufficient
              }
              setVaultAuthRequired(val);
              await SecureStore.setItemAsync(VAULT_AUTH_KEY, val ? 'true' : 'false');
              if (val) {
                Alert.alert('Vault Protected', 'PIN or FaceID will be required to access the vault.');
              }
            }}
            trackColor={{ false: '#DDD', true: highlight }}
            thumbColor={NEO.bg}
            disabled={!pinSet}
          />
        </View>
      </NeoCard>

      {/* Defaults Section */}
      <NeoCard title="Default Values" style={styles.section}>
        {/* Word count */}
        <Text style={styles.fieldLabel}>Word Count</Text>
        <View style={styles.toggleRow}>
          {WORD_OPTIONS.map((wc) => (
            <Pressable
              key={wc}
              onPress={() => handleWordCount(wc)}
              style={[
                styles.toggleBtn,
                wordCount === wc && { backgroundColor: highlight },
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  wordCount === wc && styles.toggleTextActive,
                ]}
              >
                {wc}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Address count */}
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Address Count</Text>
        <View style={styles.toggleRow}>
          {ADDRESS_OPTIONS.map((ac) => (
            <Pressable
              key={ac}
              onPress={() => handleAddressCount(ac)}
              style={[
                styles.toggleBtn,
                addressCount === ac && { backgroundColor: highlight },
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  addressCount === ac && styles.toggleTextActive,
                ]}
              >
                {ac}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Path type */}
        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>
          Derivation Path
        </Text>
        <View style={styles.toggleRow}>
          {PATH_OPTIONS.map((pt) => (
            <Pressable
              key={pt}
              onPress={() => handlePathType(pt)}
              style={[
                styles.toggleBtn,
                styles.toggleBtnWide,
                pathType === pt && { backgroundColor: highlight },
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  pathType === pt && styles.toggleTextActive,
                ]}
              >
                {DERIVATION_PATHS[pt].label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Default Path</Text>
        <PathEditor
          path={defaultPath}
          onChange={handleDefaultPath}
          pathType={pathType}
          showLabel
        />
      </NeoCard>

      {/* Links */}
      <NeoCard title="Preferences" style={styles.section}>
        <Pressable
          style={styles.linkRow}
          onPress={() => router.push('/(tabs)/settings/theme')}
        >
          <Text style={styles.linkText}>Theme</Text>
          <Text style={styles.linkArrow}>→</Text>
        </Pressable>
        <Pressable
          style={styles.linkRow}
          onPress={() => router.push('/(tabs)/settings/layout')}
        >
          <Text style={styles.linkText}>PDF Layout</Text>
          <Text style={styles.linkArrow}>→</Text>
        </Pressable>
        <Pressable
          style={[styles.linkRow, styles.linkRowLast]}
          onPress={() => router.push('/(tabs)/settings/about')}
        >
          <Text style={styles.linkText}>About</Text>
          <Text style={styles.linkArrow}>→</Text>
        </Pressable>
      </NeoCard>
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
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  bodyText: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: NEO.text,
  },
  pinStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleAuthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authHint: {
    fontFamily: NEO.fontUI,
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    lineHeight: 16,
  },
  pinForm: {
    marginTop: 16,
  },
  pinActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  errorText: {
    fontFamily: NEO.fontUI,
    fontSize: 13,
    color: '#CC0000',
    marginBottom: 8,
  },
  fieldLabel: {
    fontFamily: NEO.fontUIBold,
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleBtn: {
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: NEO.bg,
    minWidth: 48,
    alignItems: 'center',
  },
  toggleBtnWide: {
    minWidth: 100,
  },
  toggleText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 14,
    color: NEO.text,
  },
  toggleTextActive: {
    color: NEO.text,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#EEE',
  },
  linkRowLast: {
    borderBottomWidth: 0,
  },
  linkText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 16,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkArrow: {
    fontFamily: NEO.fontUIBold,
    fontSize: 18,
    color: '#999',
  },
});
