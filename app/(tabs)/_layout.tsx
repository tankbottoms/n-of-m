import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NEO } from '../../constants/theme';

export default function TabLayout() {
  const { highlight } = useTheme();

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
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: NEO.fontUIBold,
          fontSize: 12,
          textTransform: 'uppercase' as const,
          letterSpacing: 1,
        },
        tabBarIconStyle: { display: 'none' },
        tabBarActiveTintColor: highlight,
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Generate',
          headerShown: false,
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          headerShown: false,
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          headerShown: false,
          tabBarIcon: () => null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: () => null,
        }}
      />
    </Tabs>
  );
}
