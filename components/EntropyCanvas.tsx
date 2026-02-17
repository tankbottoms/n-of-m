import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as ExpoCrypto from 'expo-crypto';
import { NEO } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface EntropyCanvasProps {
  onEntropyReady: (entropy: Uint8Array) => void;
  requiredPoints?: number;
}

export function EntropyCanvas({ onEntropyReady, requiredPoints = 200 }: EntropyCanvasProps) {
  const { highlight } = useTheme();
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  const pointsRef = useRef<string[]>([]);
  const subscriptionRef = useRef<ReturnType<typeof Accelerometer.addListener> | null>(null);

  useEffect(() => {
    Accelerometer.setUpdateInterval(50); // 20 readings per second

    subscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
      if (pointsRef.current.length >= requiredPoints) return;

      const pt = `${x.toFixed(6)}:${y.toFixed(6)}:${z.toFixed(6)}:${Date.now()}`;
      pointsRef.current.push(pt);
      const newCount = pointsRef.current.length;
      setCount(newCount);

      if (newCount >= requiredPoints && !ready) {
        setReady(true);
        // Unsubscribe immediately
        subscriptionRef.current?.remove();
        subscriptionRef.current = null;

        const data = pointsRef.current.join('|');
        ExpoCrypto.digestStringAsync(
          ExpoCrypto.CryptoDigestAlgorithm.SHA256,
          data,
          { encoding: ExpoCrypto.CryptoEncoding.BASE64 }
        ).then(hashB64 => {
          const binary = atob(hashB64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          onEntropyReady(bytes);
        });
      }
    });

    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [requiredPoints, onEntropyReady, ready]);

  const progress = Math.min(count / requiredPoints, 1);

  return (
    <View style={styles.container}>
      <View style={styles.canvas}>
        <Text style={styles.instruction}>
          {ready ? 'ENTROPY COLLECTED' : 'MOVE YOUR PHONE AROUND'}
        </Text>
        <Text style={styles.hint}>
          {ready ? '' : 'Shake, tilt, or wave your device'}
        </Text>
      </View>
      <View style={styles.progressOuter}>
        <View
          style={[
            styles.progressInner,
            { width: `${progress * 100}%`, backgroundColor: highlight },
          ]}
        />
      </View>
      <Text style={styles.progressText}>{Math.round(progress * 100)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  canvas: {
    height: 200,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instruction: {
    fontFamily: NEO.fontUIBold,
    fontSize: 16,
    color: '#999',
    textTransform: 'uppercase',
  },
  hint: {
    fontFamily: NEO.fontUI,
    fontSize: 13,
    color: '#BBB',
    marginTop: 8,
  },
  progressOuter: {
    height: 8,
    borderWidth: 2,
    borderColor: NEO.border,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressInner: { height: '100%' },
  progressText: {
    fontFamily: NEO.fontMono,
    fontSize: 14,
    color: NEO.text,
    marginTop: 4,
    textAlign: 'center',
  },
});
