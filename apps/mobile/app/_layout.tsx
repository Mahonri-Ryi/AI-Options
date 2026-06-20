import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerShadowVisible: false,
          headerTintColor: colors.primary,
          headerTitleStyle: {
            color: colors.text,
            fontWeight: '600',
          },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'AI Options',
            headerStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
        <Stack.Screen name="calculator/[id]" options={{ title: 'Calculator' }} />
        <Stack.Screen name="tools/[id]" options={{ title: 'Premium Tool' }} />
      </Stack>
    </>
  );
}
