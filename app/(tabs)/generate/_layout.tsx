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
      />
    </GenerateFlowProvider>
  );
}
