import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Vibration, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { api } from '@/api';
import { haptic } from '@/lib/haptics';
import { confirmCall } from '@/state/admin';
import { gap } from '@/theme/krds';
import { Screen } from '@/ui/layout';
import { Button, Card, Txt } from '@/ui/primitives';
import { NfcPulse } from '@/ui/sheet';

const hhmm = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// 예비군 · 호출 수신. 전화가 걸려 온 것처럼 화면 전체를 채운다.
// 앱이 꺼져 있거나 백그라운드일 때 울리려면 푸시 알림(FCM/APNs)과 서버가 필요하다 (시연 범위 밖).
export default function CallReceive() {
  const { id, message, at } = useLocalSearchParams<{ id: string; message: string; at: string }>();
  const me = api.roster().find((r) => r.id === id);

  // 확인할 때까지 진동을 반복한다. 화면을 벗어나거나 사라질 때도 반드시 멈춘다.
  useFocusEffect(
    useCallback(() => {
      Vibration.vibrate([0, 800, 600], true);
      return () => Vibration.cancel();
    }, []),
  );

  // 종 아이콘이 천천히 깜빡인다
  const reduce = useReducedMotion();
  const blink = useSharedValue(1);
  useEffect(() => {
    if (reduce) return;
    blink.value = withRepeat(withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(blink);
  }, [reduce, blink]);
  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  const confirm = () => {
    Vibration.cancel();
    haptic.success();
    confirmCall(id);
    router.back();
  };

  return (
    <Screen bg="background/white" scroll={false} center contentStyle={{ alignItems: 'center', gap: gap[8] }} footer={<Button label="확인했어요" onPress={confirm} style={{ height: 64 }} />}>
      <Animated.View style={blinkStyle}>
        <NfcPulse size={150} icon="bell" bg="element/primary-light" />
      </Animated.View>
      <View style={{ alignItems: 'center', gap: gap[2] }}>
        <Txt t="body/large-bold" c="text/primary">
          예비군 호출
        </Txt>
        <Txt t="display/small" c="text/bolder" style={{ fontSize: 40, lineHeight: 56 }}>
          보급관
        </Txt>
        {me ? (
          <Txt t="body/large" c="text/subtle">
            {me.name} 님을 부르고 있어요
          </Txt>
        ) : null}
      </View>
      <Card tone="primary" style={{ alignSelf: 'stretch', alignItems: 'center', gap: gap[3] }}>
        <Txt t="heading/large" c="text/bolder" center>
          {message}
        </Txt>
        <Txt t="body/medium" c="text/subtle">
          {hhmm(Number(at))} 호출
        </Txt>
      </Card>
    </Screen>
  );
}
