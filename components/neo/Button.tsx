import React, { useState } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NEO, SHADOW, SHADOW_PRESSED } from '../../constants/theme';

interface NeoButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function NeoButton({
  title,
  variant = 'primary',
  size = 'md',
  style,
  textStyle,
  disabled,
  ...props
}: NeoButtonProps) {
  const { highlight } = useTheme();
  const [pressed, setPressed] = useState(false);

  const bgColor =
    variant === 'primary'
      ? highlight
      : variant === 'danger'
        ? '#FF6B6B'
        : NEO.bg;

  const paddingV = size === 'sm' ? 8 : size === 'lg' ? 16 : 12;
  const paddingH = size === 'sm' ? 16 : size === 'lg' ? 32 : 24;
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      style={[
        styles.base,
        {
          backgroundColor: disabled ? '#E0E0E0' : bgColor,
          paddingVertical: paddingV,
          paddingHorizontal: paddingH,
          transform: pressed
            ? [{ translateX: 2 }, { translateY: 2 }]
            : [{ translateX: 0 }, { translateY: 0 }],
        },
        pressed ? SHADOW_PRESSED : SHADOW,
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          { fontSize, fontFamily: NEO.fontUIBold },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
