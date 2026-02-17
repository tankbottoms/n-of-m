import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { NeoCard, NeoButton, NeoBadge } from '../../../components/neo';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useVault } from '../../../hooks/useVault';
import { DERIVATION_PATHS } from '../../../constants/derivation';

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function VaultScreen() {
  const { highlight } = useTheme();
  const { secrets, loading, refresh } = useVault();

  useFocusEffect(
    React.useCallback(() => {
      refresh();
    }, [refresh])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={highlight} />
        <Text style={styles.loadingText}>Loading vault...</Text>
      </View>
    );
  }

  if (secrets.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Vault</Text>
        <NeoCard title="Empty">
          <Text style={styles.emptyText}>No secrets saved yet.</Text>
          <Text style={styles.emptyHint}>
            Generate a new secret to store it in your encrypted vault.
          </Text>
          <NeoButton
            title="Generate a Secret"
            onPress={() => router.push('/(tabs)/generate')}
            style={{ marginTop: 16 }}
          />
        </NeoCard>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Vault</Text>
        <NeoBadge text={String(secrets.length)} variant="highlight" />
      </View>

      {secrets.map((secret) => {
        const pathLabel =
          secret.pathType !== 'custom'
            ? DERIVATION_PATHS[secret.pathType].label
            : 'Custom';
        return (
          <Pressable
            key={secret.id}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/vault/[id]',
                params: { id: secret.id },
              })
            }
          >
            <NeoCard style={styles.secretCard} showHeader={false}>
              <View style={styles.nameRow}>
                <Text style={[styles.secretName, { flex: 1 }]}>{secret.name}</Text>
                {secret.locked && (
                  <NeoBadge text="LOCKED" variant="highlight" />
                )}
              </View>
              <Text style={styles.secretDate}>{formatDate(secret.createdAt)}</Text>

              <View style={styles.badgeRow}>
                <NeoBadge
                  text={`${secret.wordCount} words`}
                  variant="highlight"

                />
                <NeoBadge
                  text={pathLabel}
                  variant="outline"

                />
                <NeoBadge
                  text={`${secret.shamirConfig.threshold} of ${secret.shamirConfig.totalShares} shares`}
                  variant="dark"

                />
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Addresses: </Text>
                <Text style={styles.metaValue}>{secret.addressCount}</Text>
                {secret.hasPassphrase && (
                  <>
                    <Text style={styles.metaDot}> / </Text>
                    <Text style={styles.metaLabel}>Passphrase </Text>
                  </>
                )}
                {secret.hasPIN && (
                  <>
                    <Text style={styles.metaDot}> / </Text>
                    <Text style={styles.metaLabel}>PIN </Text>
                  </>
                )}
              </View>
            </NeoCard>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: {
    flex: 1,
    backgroundColor: NEO.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  heading: {
    fontFamily: NEO.fontUIBold,
    fontSize: 24,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loadingText: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textTransform: 'uppercase',
  },
  emptyText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 16,
    color: NEO.text,
    marginBottom: 4,
  },
  emptyHint: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  secretCard: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secretName: {
    fontFamily: NEO.fontUIBold,
    fontSize: 18,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  secretDate: {
    fontFamily: NEO.fontUI,
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontFamily: NEO.fontUIBold,
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontFamily: NEO.fontMono,
    fontSize: 12,
    color: NEO.text,
  },
  metaDot: {
    fontFamily: NEO.fontUI,
    fontSize: 12,
    color: '#999',
  },
});
