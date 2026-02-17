import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { NeoButton, NeoCard, NeoInput } from '../../../components/neo';
import { verifyPIN, hasPIN } from '../../../lib/storage/keys';

const VAULT_AUTH_KEY = 'shamir_vault_auth_required';

export default function VaultLayout() {
  const { highlight } = useTheme();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authMethod, setAuthMethod] = useState<'none' | 'biometric' | 'pin'>('none');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    checkAuthRequired();
  }, []);

  const checkAuthRequired = useCallback(async () => {
    setChecking(true);
    const authRequired = await SecureStore.getItemAsync(VAULT_AUTH_KEY);
    if (authRequired !== 'true') {
      setAuthenticated(true);
      setChecking(false);
      return;
    }

    // Check if biometrics available
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = compatible && await LocalAuthentication.isEnrolledAsync();

    if (enrolled) {
      setAuthMethod('biometric');
      // Try biometric immediately
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access vault',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: true,
      });
      if (result.success) {
        setAuthenticated(true);
        setChecking(false);
        return;
      }
    }

    // Fall back to PIN
    const pinSet = await hasPIN();
    if (pinSet) {
      setAuthMethod('pin');
    } else {
      // No auth methods configured, allow access
      setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handlePinSubmit = useCallback(async () => {
    setPinError('');
    const valid = await verifyPIN(pinInput);
    if (valid) {
      setAuthenticated(true);
    } else {
      setPinError('Incorrect PIN');
      setPinInput('');
    }
  }, [pinInput]);

  const handleRetryBiometric = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access vault',
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: true,
    });
    if (result.success) {
      setAuthenticated(true);
    } else {
      const pinSet = await hasPIN();
      if (pinSet) setAuthMethod('pin');
    }
  }, []);

  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={highlight} />
      </View>
    );
  }

  if (!authenticated) {
    return (
      <View style={styles.authContainer}>
        <NeoCard title="Vault Locked">
          {authMethod === 'pin' ? (
            <>
              <Text style={styles.authText}>Enter your PIN to access the vault.</Text>
              <NeoInput
                label="PIN"
                value={pinInput}
                onChangeText={setPinInput}
                keyboardType="number-pad"
                secureTextEntry
                maxLength={8}
                containerStyle={{ marginTop: 12 }}
              />
              {pinError !== '' && <Text style={styles.errorText}>{pinError}</Text>}
              <NeoButton
                title="Unlock"
                onPress={handlePinSubmit}
                disabled={pinInput.length < 4}
                style={{ marginTop: 12 }}
              />
            </>
          ) : (
            <>
              <Text style={styles.authText}>
                Biometric authentication failed. Try again or use your PIN.
              </Text>
              <NeoButton
                title="Try FaceID Again"
                onPress={handleRetryBiometric}
                style={{ marginTop: 12 }}
              />
            </>
          )}
        </NeoCard>
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: NEO.bg,
        } as Record<string, unknown>,
        headerTitleStyle: {
          fontFamily: NEO.fontUIBold,
          textTransform: 'uppercase',
        } as Record<string, unknown>,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'VAULT',
        }}
      />
      <Stack.Screen name="[id]" options={{ title: '' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: NEO.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authContainer: {
    flex: 1,
    backgroundColor: NEO.bg,
    justifyContent: 'center',
    padding: 24,
  },
  authText: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: NEO.text,
    lineHeight: 22,
  },
  errorText: {
    fontFamily: NEO.fontUI,
    fontSize: 13,
    color: '#CC0000',
    marginTop: 8,
  },
});
