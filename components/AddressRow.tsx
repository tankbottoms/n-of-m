import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { NEO } from '../constants/theme';
import { DerivedAddress } from '../constants/types';
import { useTheme } from '../hooks/useTheme';

interface AddressRowProps {
  address: DerivedAddress;
  pinned?: boolean;
  onTogglePin?: () => void;
}

function FloatingCopied({ visible, color }: { visible: boolean; color: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(1);
      translateY.setValue(0);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -24,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.Text
      style={[
        styles.floatingCopied,
        { color, opacity, transform: [{ translateY }] },
      ]}
    >
      COPIED
    </Animated.Text>
  );
}

export function AddressRow({ address, pinned, onTogglePin }: AddressRowProps) {
  const { highlight } = useTheme();
  const [showKey, setShowKey] = useState(false);
  const [copiedField, setCopiedField] = useState<'address' | 'key' | null>(null);

  const handleCopy = useCallback(async (text: string, field: 'address' | 'key') => {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  return (
    <View style={styles.row}>
      {/* Top row: index on left, star on right */}
      <View style={styles.topRow}>
        <Text style={styles.index}>{address.index}</Text>
        {onTogglePin && (
          <Pressable onPress={onTogglePin} style={styles.starBtn}>
            <Text style={[styles.starIcon, pinned && { color: highlight }]}>
              {pinned ? '\u2605' : '\u2606'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Address with floating copy feedback */}
      <Pressable onPress={() => handleCopy(address.address, 'address')} style={styles.addressWrap}>
        <Text style={styles.address} selectable>
          {address.address}
        </Text>
        <FloatingCopied visible={copiedField === 'address'} color={highlight} />
      </Pressable>

      {/* Private key when revealed */}
      {showKey && (
        <Pressable onPress={() => handleCopy(address.privateKey, 'key')} style={styles.addressWrap}>
          <Text style={styles.privateKey} selectable>
            {address.privateKey}
          </Text>
          <FloatingCopied visible={copiedField === 'key'} color={highlight} />
        </Pressable>
      )}

      {/* Bottom row: KEY/HIDE button on the right */}
      <View style={styles.bottomRow}>
        <Pressable
          onPress={() => setShowKey(!showKey)}
          style={[
            styles.keyBtn,
            { backgroundColor: showKey ? '#FF6B6B' : highlight },
          ]}
        >
          <Text style={styles.keyBtnText}>{showKey ? 'HIDE' : 'KEY'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 2,
    borderColor: NEO.border,
    padding: 12,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  index: {
    fontFamily: NEO.fontMono,
    fontSize: 14,
    color: '#999',
    flex: 1,
  },
  starBtn: {
    padding: 4,
  },
  starIcon: {
    fontSize: 20,
    color: '#CCC',
  },
  addressWrap: {
    position: 'relative',
  },
  address: {
    fontFamily: NEO.fontMono,
    fontSize: 13,
    color: NEO.text,
    lineHeight: 20,
  },
  privateKey: {
    fontFamily: NEO.fontMono,
    fontSize: 12,
    color: '#CC0000',
    marginTop: 6,
    lineHeight: 18,
  },
  floatingCopied: {
    position: 'absolute',
    top: -2,
    right: 0,
    fontFamily: NEO.fontUIBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  keyBtn: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: NEO.border,
  },
  keyBtnText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 11,
    color: NEO.text,
  },
});
