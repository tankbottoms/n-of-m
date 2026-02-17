import { Stack } from 'expo-router';
import { NEO } from '../../../constants/theme';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: NEO.bg,
        } as Record<string, unknown>,
        headerTitleStyle: {
          fontFamily: NEO.fontUIBold,
          textTransform: 'uppercase',
        } as Record<string, unknown>,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'SETTINGS' }} />
      <Stack.Screen name="theme" options={{ title: 'THEME' }} />
      <Stack.Screen name="layout" options={{ title: 'PDF LAYOUT' }} />
      <Stack.Screen name="about" options={{ title: 'ABOUT' }} />
    </Stack>
  );
}
