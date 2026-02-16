import { Stack } from 'expo-router';
import { NEO } from '../../../constants/theme';

export default function GenerateLayout() {
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
    />
  );
}
