import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NeoCard } from '../../../components/neo';
import { NEO, SHADOW } from '../../../constants/theme';
import { useTheme } from '../../../hooks/useTheme';
import { LAYOUTS, LayoutType } from '../../../lib/pdf/layouts';

const LAYOUT_KEY = 'shamir_default_layout';
const LAYOUT_OPTIONS: LayoutType[] = ['full-page', '2-up', 'wallet-size'];

const LAYOUT_ICONS: Record<LayoutType, string[]> = {
  'full-page': ['[          ]'],
  '2-up': ['[    ]', '[    ]'],
  'wallet-size': ['[  ][  ]', '[  ][  ]'],
};

export default function LayoutScreen() {
  const { highlight } = useTheme();
  const [selected, setSelected] = useState<LayoutType>('full-page');

  useEffect(() => {
    SecureStore.getItemAsync(LAYOUT_KEY).then((v) => {
      if (v && (v === 'full-page' || v === '2-up' || v === 'wallet-size')) {
        setSelected(v);
      }
    });
  }, []);

  const handleSelect = useCallback(async (lt: LayoutType) => {
    setSelected(lt);
    await SecureStore.setItemAsync(LAYOUT_KEY, lt);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>PDF Layout</Text>
      <Text style={styles.subtitle}>
        Select the default layout for exported share PDFs.
      </Text>

      {LAYOUT_OPTIONS.map((lt) => {
        const layout = LAYOUTS[lt];
        const isSelected = selected === lt;
        return (
          <Pressable key={lt} onPress={() => handleSelect(lt)}>
            <View
              style={[
                styles.layoutCard,
                SHADOW,
                isSelected && { borderColor: highlight, borderWidth: 4 },
              ]}
            >
              {/* Visual representation */}
              <View style={styles.preview}>
                {lt === 'full-page' && (
                  <View
                    style={[styles.previewRect, styles.previewFull, { borderColor: isSelected ? highlight : NEO.border }]}
                  />
                )}
                {lt === '2-up' && (
                  <View style={styles.previewCol}>
                    <View
                      style={[styles.previewRect, styles.previewHalf, { borderColor: isSelected ? highlight : NEO.border }]}
                    />
                    <View
                      style={[styles.previewRect, styles.previewHalf, { borderColor: isSelected ? highlight : NEO.border }]}
                    />
                  </View>
                )}
                {lt === 'wallet-size' && (
                  <View style={styles.previewGrid}>
                    {[0, 1, 2, 3].map((i) => (
                      <View
                        key={i}
                        style={[styles.previewRect, styles.previewQuarter, { borderColor: isSelected ? highlight : NEO.border }]}
                      />
                    ))}
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.layoutInfo}>
                <Text style={styles.layoutName}>{layout.label}</Text>
                <Text style={styles.layoutDesc}>{layout.description}</Text>
                <Text style={styles.layoutMeta}>
                  {layout.cardsPerPage} per page / {layout.orientation} / QR {layout.qrSize}px
                </Text>
              </View>

              {isSelected && (
                <View style={[styles.selectedIndicator, { backgroundColor: highlight }]}>
                  <Text style={styles.selectedText}>✓</Text>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
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
  layoutCard: {
    backgroundColor: NEO.bg,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    flexDirection: 'row',
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    gap: 16,
  },
  preview: {
    width: 60,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewRect: {
    borderWidth: 2,
    borderRadius: 1,
    backgroundColor: '#F9F9F9',
  },
  previewFull: {
    width: 50,
    height: 70,
  },
  previewCol: {
    gap: 4,
    alignItems: 'center',
  },
  previewHalf: {
    width: 50,
    height: 32,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    width: 54,
    justifyContent: 'center',
  },
  previewQuarter: {
    width: 24,
    height: 32,
  },
  layoutInfo: {
    flex: 1,
  },
  layoutName: {
    fontFamily: NEO.fontUIBold,
    fontSize: 16,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  layoutDesc: {
    fontFamily: NEO.fontUI,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  layoutMeta: {
    fontFamily: NEO.fontMono,
    fontSize: 11,
    color: '#999',
  },
  selectedIndicator: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: {
    fontWeight: '900',
    fontSize: 16,
    color: NEO.text,
  },
});
