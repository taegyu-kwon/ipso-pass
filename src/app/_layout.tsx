import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { resetBoard } from '@/lib/board';
import { JourneyProvider } from '@/state/journey';
import { C } from '@/theme/krds';

SplashScreen.preventAutoHideAsync();
// 시연: 앱을 새로 불러오면(리로드 포함) 현황판 시트도 비운다
resetBoard();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'PretendardGOV-Regular': require('@/assets/fonts/PretendardGOV-Regular.otf'),
    'PretendardGOV-Bold': require('@/assets/fonts/PretendardGOV-Bold.otf'),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <JourneyProvider>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C['background/gray-subtler'] }, animation: 'slide_from_right' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="splash" options={{ animation: 'none', gestureEnabled: false }} />
          <Stack.Screen name="demo" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="admin" />
          <Stack.Screen name="admin-call" />
          <Stack.Screen name="admin-tag" />
          <Stack.Screen name="call-receive" options={{ presentation: 'fullScreenModal', animation: 'fade', gestureEnabled: false }} />
        </Stack>
      </JourneyProvider>
    </SafeAreaProvider>
  );
}
