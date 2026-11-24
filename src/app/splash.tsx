import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { useJourney } from '@/state/journey';
import { C, gap } from '@/theme/krds';
import { Txt } from '@/ui/primitives';

const emblem = require('@/assets/emblem.svg');
const map = require('@/assets/images/map-dots.svg');

// 데이터를 불러오는 시간. 실제 앱에서는 로그인 상태·훈련 정보를 불러오는 동안 보인다.
const LOADING_MS = 2600;
// 로딩이 길어지면(0.8초 뒤) 엠블럼 뒤 세계 지도 위로 물결이 퍼진다
const RIPPLE_DELAY_MS = 800;
const RIPPLE_MS = 1600;

// 01 스플래시 → 01-1·01-2 로딩이 길 때 (물결)
export default function Splash() {
  const insets = useSafeAreaInsets();
  const { update } = useJourney();
  const reduce = useReducedMotion();
  const wave = useSharedValue(0);

  useEffect(() => {
    if (!reduce) wave.value = withDelay(RIPPLE_DELAY_MS, withRepeat(withTiming(1, { duration: RIPPLE_MS, easing: Easing.out(Easing.cubic) }), -1, false));
    // 입소패스는 기존 예비군 앱 안의 기능이라 로그인은 기존 앱이 맡는다. 시연에서는 로딩 뒤 바로 홈으로.
    const t = setTimeout(() => {
      update((x) => ({ ...x, signedIn: true }));
      router.replace('/');
    }, LOADING_MS);
    return () => clearTimeout(t);
  }, [reduce, wave, update]);

  // 물결이 지나가는 동안만 지도가 비친다
  const mapStyle = useAnimatedStyle(() => ({ opacity: interpolate(wave.value, [0, 0.25, 1], [0, 0.9, 0]) }));
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(wave.value, [0, 0.2, 1], [0, 1, 0]),
    transform: [{ scale: interpolate(wave.value, [0, 1], [160 / 760, 1]) }],
  }));

  return (
    <View style={[styles.page, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={styles.center} pointerEvents="none">
        <View style={styles.stage}>
          <Animated.View style={[styles.ripple, rippleStyle]}>
            <Svg width={760} height={760}>
              <Defs>
                <RadialGradient id="r" cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#ffffff" stopOpacity={0.35} />
                  <Stop offset="1" stopColor="#ffffff" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={380} cy={380} r={380} fill="url(#r)" />
            </Svg>
          </Animated.View>
          <Animated.View style={[styles.map, mapStyle]}>
            <Image source={map} style={{ width: 329, height: 185 }} contentFit="contain" />
          </Animated.View>
          <Image source={emblem} style={styles.emblem} contentFit="contain" accessibilityLabel="예비군 엠블럼" />
        </View>
        <Txt t="display/small" c="text/inverse" center>
          예비군
        </Txt>
      </View>
      <View style={{ paddingBottom: Math.max(insets.bottom, 24) + 24 }}>
        <Txt t="heading/small" c="text/inverse" center>
          국방부
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C['color/primary/40'] },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: gap[5] },
  // 엠블럼 높이(144)에 맞춘 무대. 지도·물결은 그 뒤로 넘쳐 보인다.
  stage: { width: 329, height: 144, alignItems: 'center', justifyContent: 'center' },
  map: { position: 'absolute', top: (144 - 185) / 2, left: 0 },
  ripple: { position: 'absolute', width: 760, height: 760, left: (329 - 760) / 2, top: (144 - 760) / 2 },
  emblem: { width: 132, height: 144 },
});
