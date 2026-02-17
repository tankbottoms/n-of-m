import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { NEO } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { DERIVATION_PATHS } from '../constants/derivation';
import { PathType } from '../constants/types';

interface PathEditorProps {
  path: string;
  onChange: (path: string) => void;
  pathType?: PathType;
  showLabel?: boolean;
  editable?: boolean;
}

interface Segment {
  value: string;
  hardened: boolean;
  editable: boolean;
  originalIndex: number;
}

function parseSegments(path: string): Segment[] {
  const parts = path.split('/');
  return parts.map((part, i) => {
    const hardened = part.endsWith("'");
    const raw = hardened ? part.slice(0, -1) : part;
    const isNumeric = /^\d+$/.test(raw);
    return {
      value: raw,
      hardened,
      editable: isNumeric && i > 0,
      originalIndex: i,
    };
  });
}

function reconstructPath(segments: Segment[]): string {
  return segments
    .map((s) => s.value + (s.hardened ? "'" : ''))
    .join('/');
}

export function PathEditor({
  path,
  onChange,
  pathType,
  showLabel = false,
  editable = true,
}: PathEditorProps) {
  const { highlight } = useTheme();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<TextInput>(null);

  const segments = parseSegments(path);

  const label =
    showLabel && pathType && pathType !== 'custom'
      ? ` (${DERIVATION_PATHS[pathType].label})`
      : '';

  const handleTap = (segIndex: number, seg: Segment) => {
    if (!editable || !seg.editable) return;
    setEditingIndex(segIndex);
    setEditValue(seg.value);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = () => {
    if (editingIndex === null) return;
    const num = parseInt(editValue, 10);
    if (isNaN(num) || num < 0) {
      setEditingIndex(null);
      return;
    }
    const updated = segments.map((s, i) =>
      i === editingIndex ? { ...s, value: String(num) } : s
    );
    setEditingIndex(null);
    onChange(reconstructPath(updated));
  };

  return (
    <View style={styles.container}>
      <View style={styles.segmentRow}>
        {segments.map((seg, i) => {
          const isEditing = editingIndex === i;
          const showSlash = i > 0;

          return (
            <React.Fragment key={i}>
              {showSlash && <Text style={styles.separator}>/</Text>}
              {isEditing ? (
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { borderColor: highlight }]}
                  value={editValue}
                  onChangeText={setEditValue}
                  onSubmitEditing={handleSubmit}
                  onBlur={handleSubmit}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  maxLength={6}
                />
              ) : (
                <Pressable
                  onPress={() => handleTap(i, seg)}
                  disabled={!editable || !seg.editable}
                >
                  <Text
                    style={[
                      styles.segment,
                      seg.editable && editable && styles.segmentEditable,
                      seg.editable && editable && { borderBottomColor: highlight },
                    ]}
                  >
                    {seg.value}
                    {seg.hardened && <Text style={styles.hardened}>'</Text>}
                  </Text>
                </Pressable>
              )}
            </React.Fragment>
          );
        })}
        {label !== '' && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  separator: {
    fontFamily: NEO.fontMono,
    fontSize: 16,
    color: '#999',
    marginHorizontal: 1,
  },
  segment: {
    fontFamily: NEO.fontMono,
    fontSize: 16,
    color: NEO.text,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  segmentEditable: {
    borderBottomWidth: 2,
    borderStyle: 'dashed',
  },
  hardened: {
    color: '#999',
  },
  input: {
    fontFamily: NEO.fontMono,
    fontSize: 16,
    color: NEO.text,
    borderWidth: 2,
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 40,
    textAlign: 'center',
  },
  label: {
    fontFamily: NEO.fontUI,
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
});
