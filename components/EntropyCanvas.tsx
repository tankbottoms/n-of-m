import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, PanResponder, Text } from 'react-native';
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        if (ready) return;
        const pt = `${gs.moveX}:${gs.moveY}:${Date.now()}`;
        pointsRef.current.push(pt);
        const newCount = pointsRef.current.length;
        setCount(newCount);
        if (newCount >= requiredPoints) {
          setReady(true);
          const data = pointsRef.current.join('|');
          const encoded = new TextEncoder().encode(data);
          crypto.subtle.digest('SHA-256', encoded).then(hash => {
            onEntropyReady(new Uint8Array(hash));
          });
        }
      },
    })
  ).current;

  const progress = Math.min(count / requiredPoints, 1);

  return (
    <View style={styles.container}>
      <View style={styles.canvas} {...panResponder.panHandlers}>
        <Text style={styles.instruction}>
          {ready ? 'ENTROPY COLLECTED' : 'MOVE YOUR FINGER RANDOMLY'}
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
