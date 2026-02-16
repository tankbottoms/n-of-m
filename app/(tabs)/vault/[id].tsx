import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { NeoCard, NeoButton, NeoBadge } from '../../../components/neo';
import { MnemonicGrid } from '../../../components/MnemonicGrid';
import { AddressRow } from '../../../components/AddressRow';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useVault } from '../../../hooks/useVault';
import { DERIVATION_PATHS } from '../../../constants/derivation';
import { SecretRecord } from '../../../constants/types';

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VaultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { highlight } = useTheme();
  const { secrets, loading, remove } = useVault();
  const [mnemonicRevealed, setMnemonicRevealed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const secret: SecretRecord | undefined = secrets.find((s) => s.id === id);

  const handleDelete = useCallback(() => {
    if (!secret) return;
    Alert.alert(
      'Delete Secret',
      `Are you sure you want to permanently delete "${secret.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await remove(secret.id);
              router.back();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete secret.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [secret, remove]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={highlight} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!secret) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <NeoCard title="Not Found">
          <Text style={styles.bodyText}>
            This secret could not be found in the vault.
          </Text>
          <NeoButton
            title="Back to Vault"
            variant="secondary"
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
          />
        </NeoCard>
      </ScrollView>
    );
  }

  const pathLabel =
    secret.pathType !== 'custom'
      ? DERIVATION_PATHS[secret.pathType].label
      : 'Custom';

  const words = secret.mnemonic.split(' ');
  const displayAddresses = secret.addresses.slice(0, 10);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <NeoCard title={secret.name}>
        <Text style={styles.dateText}>{formatDate(secret.createdAt)}</Text>

        <View style={styles.badgeRow}>
          <NeoBadge
            text={`${secret.wordCount} words`}
            variant="highlight"
          />
          <NeoBadge text={pathLabel} variant="outline" />
          <NeoBadge
            text={`${secret.shamirConfig.threshold} of ${secret.shamirConfig.totalShares} shares`}
            variant="dark"
          />
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Derivation Path</Text>
            <Text style={styles.detailValue}>{secret.derivationPath}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Addresses</Text>
            <Text style={styles.detailValue}>{secret.addressCount}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Passphrase</Text>
            <Text style={styles.detailValue}>
              {secret.hasPassphrase ? 'Yes' : 'No'}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>PIN Protected</Text>
            <Text style={styles.detailValue}>
              {secret.hasPIN ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
      </NeoCard>

      {/* Mnemonic */}
      <NeoCard title="Seed Phrase" style={styles.section}>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            SENSITIVE DATA -- Never share your seed phrase with anyone.
          </Text>
        </View>
        <MnemonicGrid
          words={words}
          revealed={mnemonicRevealed}
          onToggleReveal={() => setMnemonicRevealed(!mnemonicRevealed)}
        />
      </NeoCard>

      {/* Addresses */}
      <NeoCard title="Derived Addresses" style={styles.section}>
        {displayAddresses.length === 0 ? (
          <Text style={styles.bodyText}>No addresses derived.</Text>
        ) : (
          <>
            {displayAddresses.map((addr) => (
              <AddressRow key={addr.index} address={addr} />
            ))}
            {secret.addresses.length > 10 && (
              <Text style={styles.moreText}>
                + {secret.addresses.length - 10} more addresses
              </Text>
            )}
          </>
        )}
      </NeoCard>

      {/* Metadata */}
      {secret.metadata && Object.keys(secret.metadata).length > 0 && (
        <NeoCard title="Metadata" style={styles.section}>
          {Object.entries(secret.metadata).map(([key, value]) => (
            <View key={key} style={styles.metaEntryRow}>
              <Text style={styles.metaKey}>{key}</Text>
              <Text style={styles.metaVal}>{value}</Text>
            </View>
          ))}
        </NeoCard>
      )}

      {/* Delete */}
      <View style={styles.dangerSection}>
        <NeoButton
          title={deleting ? 'Deleting...' : 'Delete Secret'}
          variant="danger"
          onPress={handleDelete}
          disabled={deleting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: NEO.bg },
  content: { padding: 16, paddingBottom: 60 },
  center: {
    flex: 1,
    backgroundColor: NEO.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textTransform: 'uppercase',
  },
  section: {
    marginTop: 16,
  },
  dateText: {
    fontFamily: NEO.fontUI,
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    minWidth: '40%',
  },
  detailLabel: {
    fontFamily: NEO.fontUIBold,
    fontSize: 11,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: NEO.fontMono,
    fontSize: 13,
    color: NEO.text,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderWidth: 2,
    borderColor: NEO.border,
    padding: 10,
    marginBottom: 12,
  },
  warningText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 12,
    color: '#856404',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bodyText: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  moreText: {
    fontFamily: NEO.fontUI,
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  metaEntryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  metaKey: {
    fontFamily: NEO.fontUIBold,
    fontSize: 13,
    color: '#666',
    textTransform: 'uppercase',
  },
  metaVal: {
    fontFamily: NEO.fontMono,
    fontSize: 13,
    color: NEO.text,
  },
  dangerSection: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#FF6B6B',
  },
});
