import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NEO, SHADOW } from '../../constants/theme';

function TabButton({ label, focused }: { label: string; focused: boolean }) {
  const { highlight } = useTheme();
  return (
    <View
      style={[
        styles.tabButton,
        focused && { backgroundColor: highlight, ...SHADOW },
        !focused && styles.tabButtonInactive,
      ]}
    >
      <Text
        style={[
          styles.tabButtonText,
          !focused && { color: '#999' },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: NEO.bg,
          borderBottomWidth: NEO.borderWidth,
          borderBottomColor: NEO.border,
        },
        headerTitleStyle: {
          fontFamily: NEO.fontUIBold,
          fontSize: 18,
          color: NEO.text,
          textTransform: 'uppercase' as const,
        },
        tabBarStyle: {
          backgroundColor: NEO.bg,
          borderTopWidth: NEO.borderWidth,
          borderTopColor: NEO.border,
          height: 72,
          paddingBottom: 14,
          paddingTop: 10,
          paddingHorizontal: 4,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabButton label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Generate',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabButton label="New" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabButton label="Scan" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabButton label="Vault" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabButton label="Set" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    backgroundColor: NEO.bg,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
  },
  tabButtonInactive: {
    borderColor: '#CCC',
  },
  tabButtonText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 11,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
