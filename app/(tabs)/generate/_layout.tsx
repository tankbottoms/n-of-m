import { Stack } from 'expo-router';
import { NEO } from '../../../constants/theme';
import { GenerateFlowProvider } from '../../../hooks/useGenerateFlow';

export default function GenerateLayout() {
  return (
    <GenerateFlowProvider>
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
        <Stack.Screen name="index" options={{ title: 'GENERATE' }} />
        <Stack.Screen name="entropy" options={{ title: 'ENTROPY' }} />
        <Stack.Screen name="mnemonic" options={{ title: 'MNEMONIC' }} />
        <Stack.Screen name="derivation" options={{ title: 'DERIVATION' }} />
        <Stack.Screen name="shamir" options={{ title: 'SHAMIR SPLIT' }} />
        <Stack.Screen name="metadata" options={{ title: 'METADATA' }} />
        <Stack.Screen name="preview" options={{ title: 'PREVIEW' }} />
        <Stack.Screen name="share" options={{ title: 'SHARE' }} />
      </Stack>
    </GenerateFlowProvider>
  );
}
