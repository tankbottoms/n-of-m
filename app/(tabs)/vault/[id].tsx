import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  TextInput,
} from 'react-native';
import { Buffer } from 'buffer';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { NeoCard, NeoButton, NeoBadge } from '../../../components/neo';
import { MnemonicGrid } from '../../../components/MnemonicGrid';
import { AddressRow } from '../../../components/AddressRow';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useVault } from '../../../hooks/useVault';
import { DERIVATION_PATHS } from '../../../constants/derivation';
import { deriveAddresses } from '../../../lib/wallet';
import { split } from '../../../lib/shamir';
import { generatePDF, sharePDF } from '../../../lib/pdf/generate';
import { PathType, SharePayload } from '../../../constants/types';

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
  const { secrets, loading, update, remove } = useVault();
  const [mnemonicRevealed, setMnemonicRevealed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [deriving, setDeriving] = useState(false);

  const secret = secrets.find((s) => s.id === id);
  const isLocked = secret?.locked ?? false;

  const [derivePathType, setDerivePathType] = useState<PathType>(secret?.pathType ?? 'metamask');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const handleDelete = useCallback(() => {
    if (!secret) return;
    if (isLocked) {
      Alert.alert('Locked', 'Unlock this secret before deleting.');
      return;
    }
    Alert.alert(
      'Delete Secret',
      `Permanently delete "${secret.name}"? This cannot be undone.`,
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
            } catch {
              Alert.alert('Error', 'Failed to delete secret.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [secret, isLocked, remove]);

  const handleToggleLock = useCallback(async () => {
    if (!secret) return;
    await update(secret.id, { locked: !isLocked });
  }, [secret, isLocked, update]);

  const handleStartEditName = useCallback(() => {
    if (!secret) return;
    setEditName(secret.name);
    setEditingName(true);
  }, [secret]);

  const handleSaveName = useCallback(async () => {
    if (!secret) return;
    const trimmed = editName.trim();
    if (trimmed.length > 0) {
      await update(secret.id, { name: trimmed });
    }
    setEditingName(false);
  }, [secret, editName, update]);

  const handleDeriveMore = useCallback(async (count: number) => {
    if (!secret) return;
    setDeriving(true);
    setTimeout(async () => {
      try {
        const startIndex = secret.addresses.length;
        const totalNeeded = startIndex + count;
        const allAddresses = deriveAddresses(
          secret.mnemonic,
          derivePathType,
          totalNeeded,
          derivePathType === 'custom' ? secret.derivationPath : undefined
        );
        const newAddresses = allAddresses.slice(startIndex);
        await update(secret.id, {
          addresses: [...secret.addresses, ...newAddresses],
          addressCount: totalNeeded,
        });
      } catch (err) {
        if (__DEV__) console.error('Derive error:', err);
        Alert.alert('Error', 'Failed to derive addresses.');
      }
      setDeriving(false);
    }, 50);
  }, [secret, derivePathType, update]);

  const handleDownloadPDF = useCallback(async () => {
    if (!secret) return;
    setGeneratingPDF(true);
    try {
      const secretBuffer = Buffer.from(secret.mnemonic);
      const shares = split(secretBuffer, {
        shares: secret.shamirConfig.totalShares,
        threshold: secret.shamirConfig.threshold,
      });
      const sharePayloads: SharePayload[] = shares.map((shareBuf, i) => ({
        v: 1 as const,
        id: secret.id,
        name: secret.name,
        shareIndex: i + 1,
        totalShares: secret.shamirConfig.totalShares,
        threshold: secret.shamirConfig.threshold,
        shareData: (shareBuf as Buffer).toString('hex'),
        derivationPath: secret.derivationPath,
        pathType: secret.pathType,
        wordCount: secret.wordCount,
        metadata: secret.metadata,
        hasPIN: secret.hasPIN,
        hasPassphrase: secret.hasPassphrase,
      }));
      const firstAddr = secret.addresses.length > 0 ? secret.addresses[0].address : undefined;
      const uri = await generatePDF(sharePayloads, highlight, 'full-page', firstAddr);
      await sharePDF(uri);
    } catch (err) {
      if (__DEV__) console.error('PDF error:', err);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
    setGeneratingPDF(false);
  }, [secret, highlight]);

  const handleTogglePin = useCallback(async (addrIndex: number) => {
    if (!secret) return;
    const updatedAddresses = secret.addresses.map((a) =>
      a.index === addrIndex ? { ...a, pinned: !a.pinned } : a
    );
    await update(secret.id, { addresses: updatedAddresses });
  }, [secret, update]);

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
  const displayAddresses = secret.addresses;
  const sortedAddresses = [...displayAddresses].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return a.index - b.index;
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: secret.name,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Name (tappable to edit) */}
        <NeoCard showHeader={false}>
          {editingName ? (
            <View style={styles.editNameRow}>
              <TextInput
                style={styles.editNameInput}
                value={editName}
                onChangeText={setEditName}
                autoFocus
                onSubmitEditing={handleSaveName}
                returnKeyType="done"
              />
              <NeoButton title="Save" size="sm" onPress={handleSaveName} />
            </View>
          ) : (
            <Pressable onPress={handleStartEditName}>
              <Text style={styles.secretName}>{secret.name}</Text>
              <Text style={styles.editHint}>Tap to rename</Text>
            </Pressable>
          )}
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
            <Pressable onPress={handleToggleLock}>
              <NeoBadge
                text={isLocked ? 'LOCKED' : 'UNLOCKED'}
                variant={isLocked ? 'highlight' : 'outline'}
              />
            </Pressable>
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
          {sortedAddresses.length === 0 ? (
            <Text style={styles.bodyText}>No addresses derived.</Text>
          ) : (
            <>
              {sortedAddresses.map((addr) => (
                <AddressRow
                  key={addr.index}
                  address={addr}
                  pinned={addr.pinned}
                  onTogglePin={() => handleTogglePin(addr.index)}
                />
              ))}
            </>
          )}
        </NeoCard>

        {/* Derive More Addresses */}
        <NeoCard title="Derive More" style={styles.section}>
          <Text style={styles.bodyText}>
            Generate additional addresses from this seed phrase.
          </Text>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.detailLabel}>Path Type</Text>
            <View style={styles.pathTypeRow}>
              {(['metamask', 'ledger', 'custom'] as PathType[]).map((pt) => (
                <NeoButton
                  key={pt}
                  title={DERIVATION_PATHS[pt].label}
                  size="sm"
                  variant={derivePathType === pt ? 'primary' : 'secondary'}
                  onPress={() => setDerivePathType(pt)}
                  style={{ marginRight: 8 }}
                />
              ))}
            </View>
          </View>

          <Text style={styles.pathTemplate}>
            {derivePathType === 'custom'
              ? secret.derivationPath
              : DERIVATION_PATHS[derivePathType].template.replace(
                  '{index}',
                  `${secret.addresses.length}...`
                )}
          </Text>

          {deriving && (
            <ActivityIndicator size="small" color={highlight} style={{ marginTop: 12 }} />
          )}

          <View style={{ marginTop: 16 }}>
            <Text style={styles.detailLabel}>Generate</Text>
            <View style={[styles.pathTypeRow, { marginTop: 6 }]}>
              {[5, 10, 20].map((n) => (
                <NeoButton
                  key={n}
                  title={`+${n}`}
                  size="sm"
                  variant="secondary"
                  onPress={() => handleDeriveMore(n)}
                  disabled={deriving || isLocked}
                  style={{ minWidth: 50 }}
                />
              ))}
            </View>
          </View>
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

        {/* Download PDF */}
        <NeoButton
          title={generatingPDF ? 'Generating PDF...' : 'Download PDF'}
          onPress={handleDownloadPDF}
          disabled={generatingPDF || isLocked}
          variant="secondary"
          style={{ marginTop: 24 }}
        />
        {generatingPDF && (
          <ActivityIndicator size="small" color={highlight} style={{ marginTop: 8 }} />
        )}

        {/* Delete - at very bottom */}
        <NeoButton
          title="Delete Secret"
          variant="danger"
          onPress={handleDelete}
          disabled={deleting || isLocked}
          style={{ marginTop: 32, marginBottom: 20 }}
        />
      </ScrollView>
    </>
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
  pathTemplate: {
    fontFamily: NEO.fontMono,
    fontSize: 13,
    color: NEO.text,
    marginTop: 8,
  },
  secretName: {
    fontFamily: NEO.fontUIBold,
    fontSize: 20,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editHint: {
    fontFamily: NEO.fontUI,
    fontSize: 11,
    color: '#BBB',
    marginBottom: 4,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  editNameInput: {
    flex: 1,
    fontFamily: NEO.fontUIBold,
    fontSize: 18,
    color: NEO.text,
    borderWidth: 2,
    borderColor: NEO.border,
    padding: 8,
  },
  dateText: {
    fontFamily: NEO.fontMono,
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  section: {
    marginTop: 16,
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
  pathTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
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
});
