import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { NeoButton, NeoCard, NeoBadge } from '../../../components/neo';
import { QRCodeView } from '../../../components/QRCodeView';
import { NEO } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { useGenerateFlow } from '../../../hooks/useGenerateFlow';
import { generatePDF } from '../../../lib/pdf/generate';
import { LAYOUTS, LayoutType } from '../../../lib/pdf/layouts';

const LAYOUT_OPTIONS: LayoutType[] = ['full-page', '2-up', 'wallet-size'];

export default function PreviewScreen() {
  const { highlight } = useTheme();
  const { state, update } = useGenerateFlow();
  const { shares } = state;

  const [layoutType, setLayoutType] = useState<LayoutType>('full-page');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePDF = useCallback(async () => {
    if (shares.length === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const uri = await generatePDF(shares, highlight, layoutType);
      update({ pdfUri: uri });
      router.push('/(tabs)/generate/share');
    } catch (err) {
      console.error('PDF generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  }, [shares, highlight, layoutType, update]);

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
      {shares.map((share, i) => {
        const qrData = JSON.stringify(share);
        return (
          <NeoCard
            key={share.shareIndex}
            title={`Share ${share.shareIndex} of ${share.totalShares}`}
            style={{ marginTop: 16 }}
          >
            <View style={styles.shareCard}>
              <View style={styles.qrWrapper}>
                <QRCodeView value={qrData} size={140} />
              </View>
              <View style={styles.shareMeta}>
                <NeoBadge
                  text={`${share.threshold} of ${share.totalShares}`}
                  variant="highlight"
                  style={{ marginBottom: 8 }}
                />
                <Text style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Name: </Text>
                  {share.name}
                </Text>
                <Text style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Path: </Text>
                  {share.pathType}
                </Text>
                <Text style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Words: </Text>
                  {share.wordCount}
                </Text>
                <Text style={styles.metaRow}>
                  <Text style={styles.metaLabel}>PIN: </Text>
                  {share.hasPIN ? 'Required' : 'None'}
                </Text>
              </View>
            </View>
          </NeoCard>
        );
      })}

      {/* Error message */}
      {error && (
        <View style={[styles.errorBox, { borderColor: '#CC0000' }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Generate PDF button */}
      <NeoButton
        title={generating ? 'Generating...' : 'Generate PDF'}
        onPress={handleGeneratePDF}
        disabled={generating}
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
  shareCard: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'flex-start',
  },
  qrWrapper: {
    flexShrink: 0,
  },
  shareMeta: {
    flex: 1,
    paddingTop: 4,
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
