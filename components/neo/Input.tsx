import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NEO } from '../../constants/theme';

interface NeoInputProps extends TextInputProps {
  label?: string;
  mono?: boolean;
  containerStyle?: ViewStyle;
}

export function NeoInput({
  label,
  mono = false,
  containerStyle,
  ...props
}: NeoInputProps) {
  const { highlight } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          {
            fontFamily: mono ? NEO.fontMono : NEO.fontUI,
            borderColor: focused ? highlight : NEO.border,
          },
        ]}
        placeholderTextColor="#999"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontFamily: NEO.fontUIBold,
    fontSize: 14,
    color: NEO.text,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: NEO.bg,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    borderRadius: NEO.radius,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: NEO.text,
  },
});
