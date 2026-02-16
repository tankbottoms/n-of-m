import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { NEO } from '../../constants/theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const { highlight } = useTheme();
  return (
    <View style={[styles.tabIcon, focused && { backgroundColor: highlight }]}>
      <Text style={styles.tabIconText}>{name}</Text>
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
          height: 80,
          paddingBottom: 20,
        },
        tabBarLabelStyle: {
          fontFamily: NEO.fontUIBold,
          fontSize: 11,
          textTransform: 'uppercase' as const,
          letterSpacing: 0.5,
        },
        tabBarActiveTintColor: NEO.text,
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="H" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Generate',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="G" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="S" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="V" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon name="*" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: NEO.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 14,
    color: NEO.text,
  },
});
