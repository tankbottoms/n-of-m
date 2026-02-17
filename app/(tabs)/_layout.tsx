import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { NEO, SHADOW } from '../../constants/theme';
import Constants from 'expo-constants';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const BUILD_NUMBER = String((Constants.expoConfig?.extra as Record<string, unknown>)?.buildNumber ?? '');

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  generate: 'Generate',
  scan: 'Scan',
  vault: 'Vault',
  settings: 'Settings',
};

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { highlight } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Buttons sit above the border line */}
      <View style={styles.buttonRow}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = TAB_LABELS[route.name] || route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
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
            </Pressable>
          );
        })}
      </View>
      {/* Border line below buttons */}
      <View style={styles.separator} />
      {/* Version below the line */}
      <Text style={styles.versionText}>v{APP_VERSION} ({BUILD_NUMBER})</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
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
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="generate" options={{ title: 'Generate', headerShown: false }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan', headerShown: false }} />
      <Tabs.Screen name="vault" options={{ title: 'Vault', headerShown: false }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', headerShown: false }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    backgroundColor: NEO.bg,
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: NEO.borderWidth,
    borderColor: NEO.border,
    backgroundColor: NEO.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonInactive: {
    borderColor: '#DDD',
  },
  tabButtonText: {
    fontFamily: NEO.fontUIBold,
    fontSize: 11,
    color: NEO.text,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  separator: {
    height: NEO.borderWidth,
    backgroundColor: NEO.border,
    marginHorizontal: -16,
  },
  versionText: {
    fontFamily: NEO.fontMono,
    fontSize: 10,
    color: '#BBB',
    textAlign: 'center',
    marginTop: 6,
  },
});
