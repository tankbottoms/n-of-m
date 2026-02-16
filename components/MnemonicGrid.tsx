import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NEO } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface MnemonicGridProps {
  words: string[];
  revealed?: boolean;
  onToggleReveal?: () => void;
}

export function MnemonicGrid({ words, revealed = true, onToggleReveal }: MnemonicGridProps) {
  const { highlight } = useTheme();

  return (
    <View>
      {onToggleReveal && (
        <Pressable
          onPress={onToggleReveal}
          style={[styles.toggleBtn, { backgroundColor: highlight }]}
        >
          <Text style={styles.toggleText}>{revealed ? 'HIDE' : 'REVEAL'}</Text>
        </Pressable>
      )}
      <View style={styles.grid}>
        {words.map((word, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.index}>{i + 1}</Text>
            <Text style={styles.word}>{revealed ? word : '****'}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '30%',
    flexGrow: 1,
    minWidth: 100,
    borderWidth: 2,
    borderColor: NEO.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  index: {
    fontFamily: NEO.fontMono,
    fontSize: 12,
    color: '#999',
    width: 24,
  },
  word: { fontFamily: NEO.fontMono, fontSize: 14, color: NEO.text },
  toggleBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: NEO.border,
    marginBottom: 8,
  },
  toggleText: { fontFamily: NEO.fontUIBold, fontSize: 12, color: NEO.text },
});
