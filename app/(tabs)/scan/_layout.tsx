import { Stack } from 'expo-router';
import { NEO } from '../../../constants/theme';
import { ScanFlowProvider } from '../../../hooks/useScanFlow';

export default function ScanLayout() {
  return (
    <ScanFlowProvider>
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
        <Stack.Screen name="index" options={{ title: 'SCAN' }} />
        <Stack.Screen name="pin" options={{ title: 'ENTER PIN' }} />
        <Stack.Screen name="result" options={{ title: 'RESULT' }} />
      </Stack>
    </ScanFlowProvider>
  );
}
