import React from 'react';
import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { NEO } from '../constants/theme';

interface QRCodeViewProps {
  value: string;
  size?: number;
}

export function QRCodeView({ value, size = 200 }: QRCodeViewProps) {
  return (
    <View style={[styles.container, { width: size + 24, height: size + 24 }]}>
      <QRCode value={value} size={size} backgroundColor={NEO.bg} color={NEO.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEO.bg,
    padding: 12,
  },
});
