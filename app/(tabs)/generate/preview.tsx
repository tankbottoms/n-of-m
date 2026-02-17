import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { NeoButton, NeoCard, NeoBadge, NeoModal } from '../../../components/neo';
import { QRCodeView } from '../../../components/QRCodeView';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useGenerateFlow } from '../../../hooks/useGenerateFlow';
import { generatePDF } from '../../../lib/pdf/generate';
import { renderSingleCardHTML } from '../../../lib/pdf/templates';
import { LAYOUTS, LayoutType } from '../../../lib/pdf/layouts';
import { DERIVATION_PATHS } from '../../../constants/derivation';
import { SharePayload } from '../../../constants/types';

const LAYOUT_OPTIONS: LayoutType[] = ['full-page', '2-up', 'wallet-size'];

export default function PreviewScreen() {
  const { highlight } = useTheme();
  const { state, update } = useGenerateFlow();
  const { shares } = state;

  const [layoutType, setLayoutType] = useState<LayoutType>('full-page');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalShare, setModalShare] = useState<SharePayload | null>(null);

  const generationDate = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const handleGeneratePDF = useCallback(async () => {
    if (shares.length === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const uri = await generatePDF(shares, highlight, layoutType, state.firstAddress);
      update({ pdfUri: uri });
      router.push('/(tabs)/generate/share');
    } catch (err) {
      if (__DEV__) console.error('PDF generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  }, [shares, highlight, layoutType, state.firstAddress, update]);

  if (shares.length === 0) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Preview</Text>
        <NeoCard title="No Shares">
          <Text style={styles.emptyText}>
            No shares have been generated yet. Go back to the generate flow to create shares.
          </Text>
          <NeoButton
            title="Go Back"
            onPress={() => router.back()}
            variant="secondary"
            style={{ marginTop: 16 }}
          />
        </NeoCard>
      </ScrollView>
    );
  }

  const pathLabel =
    shares[0].pathType !== 'custom'
      ? DERIVATION_PATHS[shares[0].pathType]?.label
      : 'Custom';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Preview</Text>
      <Text style={styles.subtitle}>
        Review your {shares.length} shares before generating the PDF.
      </Text>

      {/* Layout selector */}
      <NeoCard title="Layout">
        <View style={styles.layoutRow}>
          {LAYOUT_OPTIONS.map((lt) => (
            <NeoButton
              key={lt}
              title={LAYOUTS[lt].label}
              size="sm"
              variant={layoutType === lt ? 'primary' : 'secondary'}
              onPress={() => setLayoutType(lt)}
              style={styles.layoutBtn}
            />
          ))}
        </View>
        <Text style={styles.layoutDesc}>{LAYOUTS[layoutType].description}</Text>
      </NeoCard>

      {/* Share card previews */}
      {shares.map((share) => {
        const qrData = JSON.stringify(share);
        const cardTitle = `${share.name}-${share.shareIndex}`;
        const derivPath = `${share.derivationPath} (${pathLabel})`;

        return (
          <Pressable
            key={share.shareIndex}
            onPress={() => setModalShare(share)}
          >
            <NeoCard showHeader={false} style={{ marginTop: 16 }}>
              {/* Header bar mimicking PDF card */}
              <View style={[styles.cardHeader, { backgroundColor: highlight }]}>
                <Text style={styles.cardHeaderTitle}>
                  {share.shareIndex} OF {share.totalShares}
                </Text>
                <Text style={styles.cardHeaderMeta}>
                  {share.threshold} of {share.totalShares} required
                </Text>
              </View>

              <View style={styles.shareCard}>
                <View style={styles.qrWrapper}>
                  <QRCodeView value={qrData} size={140} />
                </View>
                <View style={styles.shareMeta}>
                  <Text style={styles.cardName}>{cardTitle}</Text>
                  <Text style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Path: </Text>
                    {derivPath}
                  </Text>
                  <Text style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Words: </Text>
                    {share.wordCount}
                  </Text>
                  {share.hasPIN && (
                    <NeoBadge
                      text={'PIN ' + 'X'.repeat(state.pin?.length ?? 4)}
                      variant="dark"
                      style={{ marginTop: 6 }}
                    />
                  )}
                  <Text style={styles.dateText}>{generationDate}</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <Text style={styles.footerWarning}>
                  DO NOT LOSE -- SHARE {share.shareIndex} OF {share.totalShares}
                </Text>
                <Text style={styles.footerInfo}>
                  PIN: {share.hasPIN ? 'ENABLED' : 'NONE'} / PASSPHRASE: {share.hasPassphrase ? 'ENABLED' : 'NONE'}
                </Text>
              </View>

              <Text style={styles.tapHint}>Tap to view full card</Text>
            </NeoCard>
          </Pressable>
        );
      })}

      {/* Full card modal */}
      <NeoModal
        visible={modalShare !== null}
        onClose={() => setModalShare(null)}
        title={modalShare ? `Share ${modalShare.shareIndex} of ${modalShare.totalShares}` : ''}
        fullScreen
      >
        {modalShare && (
          <WebView
            originWhitelist={['*']}
            source={{
              html: renderSingleCardHTML(
                modalShare,
                highlight,
                LAYOUTS[layoutType],
                state.firstAddress
              ),
            }}
            style={{ flex: 1 }}
            scrollEnabled
          />
        )}
      </NeoModal>

      {/* Error message */}
      {error && (
        <View style={[styles.errorBox, { borderColor: '#CC0000' }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Generate PDF button */}
      <View style={{ marginTop: 24 }}>
        <NeoButton
          title={generating ? 'Generating...' : 'Generate PDF'}
          onPress={handleGeneratePDF}
          disabled={generating}
        />
        {generating && (
          <ActivityIndicator
            size="small"
            color={highlight}
            style={{ position: 'absolute', right: 16, top: 14 }}
          />
        )}
      </View>
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
  emptyText: {
    fontFamily: NEO.fontUI,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  layoutRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  layoutBtn: {
    minWidth: 80,
  },
  layoutDesc: {
    fontFamily: NEO.fontUI,
    fontSize: 13,
    color: '#666',
    marginTop: 10,
    lineHeight: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: NEO.borderWidth,
    borderBottomColor: NEO.border,
  },
  cardHeaderTitle: {
    fontFamily: NEO.fontUIBold,
    fontSize: 14,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  cardHeaderMeta: {
    fontFamily: NEO.fontUI,
    fontSize: 10,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  shareCard: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
    padding: 12,
  },
  qrWrapper: {
    flexShrink: 0,
  },
  shareMeta: {
    flex: 1,
    paddingTop: 4,
  },
  cardName: {
    fontFamily: NEO.fontUIBold,
    fontSize: 15,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  metaRow: {
    fontFamily: NEO.fontUI,
    fontSize: 13,
    color: NEO.text,
    lineHeight: 20,
  },
  metaLabel: {
    fontFamily: NEO.fontUIBold,
    color: '#666',
    textTransform: 'uppercase',
    fontSize: 11,
  },
  dateText: {
    fontFamily: NEO.fontMono,
    fontSize: 11,
    color: '#999',
    marginTop: 8,
  },
  cardFooter: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopWidth: 2,
    borderTopColor: NEO.border,
  },
  footerWarning: {
    fontFamily: NEO.fontUIBold,
    fontSize: 9,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footerInfo: {
    fontFamily: NEO.fontUIBold,
    fontSize: 8,
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  tapHint: {
    fontFamily: NEO.fontUI,
    fontSize: 11,
    color: '#BBB',
    textAlign: 'center',
    paddingVertical: 6,
  },
  errorBox: {
    borderWidth: 2,
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
