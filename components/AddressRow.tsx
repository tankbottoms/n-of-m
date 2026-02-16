import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { NEO } from '../constants/theme';
import { DerivedAddress } from '../constants/types';
import { useTheme } from '../hooks/useTheme';

interface AddressRowProps {
  address: DerivedAddress;
}

export function AddressRow({ address }: AddressRowProps) {
  const { highlight } = useTheme();
  const [showKey, setShowKey] = useState(false);

  const truncated = `${address.address.slice(0, 8)}...${address.address.slice(-6)}`;
  const truncatedKey = showKey
    ? `${address.privateKey.slice(0, 10)}...${address.privateKey.slice(-8)}`
    : '0x****...****';

  return (
    <View style={styles.row}>
      <Text style={styles.index}>{address.index}</Text>
      <View style={styles.details}>
        <Text style={styles.address}>{truncated}</Text>
        <Text style={[styles.key, showKey && { color: '#CC0000' }]}>
          {truncatedKey}
        </Text>
      </View>
      <Pressable
        onPress={() => setShowKey(!showKey)}
        style={[
          styles.btn,
          { backgroundColor: showKey ? '#FF6B6B' : highlight },
        ]}
      >
        <Text style={styles.btnText}>{showKey ? 'HIDE' : 'KEY'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: NEO.border,
    padding: 12,
    marginBottom: 8,
  },
  index: {
    fontFamily: NEO.fontMono,
    fontSize: 14,
    color: '#999',
    width: 24,
  },
  details: { flex: 1 },
  address: { fontFamily: NEO.fontMono, fontSize: 14, color: NEO.text },
  key: {
    fontFamily: NEO.fontMono,
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 2,
    borderColor: NEO.border,
  },
  btnText: { fontFamily: NEO.fontUIBold, fontSize: 11, color: NEO.text },
});
