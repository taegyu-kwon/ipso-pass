import { ReactNode, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  SlideInDown,
  SlideOutDown,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { C, ColorToken, gap, padding, radius } from '@/theme/krds';
import { IconName } from '@/theme/icons';
import { Icon, Txt } from '@/ui/primitives';

const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);

// NFC 대기 원: 가운데 아이콘 뒤로 물결이 퍼진다
export function NfcPulse({ size = 112, icon = 'nfc', color = 'icon/primary', bg = 'surface/primary-subtler', pulse = true }: {
  size?: number;
  icon?: IconName;
  color?: ColorToken;
  bg?: ColorToken;
  pulse?: boolean;
}) {
  const reduce = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    if (!pulse || reduce) return;
    v.value = withRepeat(withTiming(1, { duration: 1600, easing: EASE_OUT }), -1, false);
  }, [pulse, reduce, v]);
  const ring = useAnimatedStyle(() => ({
    opacity: interpolate(v.value, [0, 1], [0.5, 0]),
    transform: [{ scale: interpolate(v.value, [0, 1], [1, 1.45]) }],
  }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {pulse ? <Animated.View style={[StyleSheet.absoluteFill, { borderRadius: size / 2, borderWidth: 2, borderColor: C['border/primary'] }, ring]} /> : null}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C[bg], alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={size * 0.43} color={color} />
      </View>
    </View>
  );
}

// 완료 체크 (iOS 완료 표시처럼 차분하게): 초록 원이 살짝 커지며 나타나고, 흰 체크가 왼쪽에서 오른쪽으로 그어진다
const AnimatedPath = Animated.createAnimatedComponent(Path);
const CHECK = 'M7 12.5 L10.5 16 L17 8.5'; // 24×24 기준
const CHECK_LEN = 15; // 위 두 선분 길이 합 (약 4.95 + 9.92)
export function CheckBurst({ size = 64 }: { size?: number }) {
  const reduce = useReducedMotion();
  const circle = useSharedValue(reduce ? 1 : 0);
  const draw = useSharedValue(reduce ? 1 : 0);
  useEffect(() => {
    if (reduce) return;
    circle.value = withTiming(1, { duration: 320, easing: EASE_OUT });
    draw.value = withDelay(180, withTiming(1, { duration: 380, easing: Easing.bezier(0.65, 0, 0.35, 1) }));
  }, [reduce, circle, draw]);
  const circleStyle = useAnimatedStyle(() => ({ opacity: circle.value, transform: [{ scale: interpolate(circle.value, [0, 1], [0.8, 1]) }] }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LEN * (1 - draw.value) }));
  const inner = size * 0.62;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: C['surface/success-subtler'] }}>
      <Animated.View style={[{ width: inner, height: inner, borderRadius: inner / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: C['icon/success'] }, circleStyle]}>
        <Svg width={inner * 0.7} height={inner * 0.7} viewBox="0 0 24 24">
          <AnimatedPath d={CHECK} fill="none" stroke="#ffffff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={CHECK_LEN} animatedProps={checkProps} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// 딤 + 하단 시트. 성공·실패·대기처럼 화면을 바꿀 필요가 없는 상태에 쓴다.
export function Sheet({
  icon,
  iconColor = 'icon/primary',
  iconBg = 'surface/primary-subtler',
  pulse,
  title,
  desc,
  extra,
  art,
  onIconPress,
  children,
}: {
  art?: ReactNode; // 아이콘 자리에 직접 그릴 것 (로딩·완료 애니메이션)
  icon?: IconName;
  iconColor?: ColorToken;
  iconBg?: ColorToken;
  pulse?: boolean;
  title: string;
  desc?: string;
  extra?: ReactNode;
  onIconPress?: () => void; // 시연: 아이콘을 누르면 태그한 것으로
  children?: ReactNode; // 버튼들
}) {
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  return (
    <Animated.View style={StyleSheet.absoluteFill} exiting={reduce ? undefined : FadeOut.duration(200)}>
      <Animated.View entering={reduce ? undefined : FadeIn.duration(220)} style={[StyleSheet.absoluteFill, { backgroundColor: C['background/dim'] }]} />
      <Animated.View
        entering={reduce ? undefined : SlideInDown.duration(280).easing(EASE_OUT)}
        exiting={reduce ? undefined : SlideOutDown.duration(200)}
        style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, padding[6]) + 8 }]}
        accessibilityViewIsModal>
        <View style={styles.grabber} />
        {art ? (
          art
        ) : icon === 'success-fill' ? (
          // 태그 대기 원(88)과 같은 크기라 성공으로 바뀌어도 시트 높이가 그대로다
          <CheckBurst size={88} />
        ) : icon ? (
          pulse ? (
            <Pressable onPress={onIconPress} disabled={!onIconPress} accessibilityLabel={onIconPress ? '태그하기' : undefined}>
              <NfcPulse size={88} icon={icon} color={iconColor} bg={iconBg} />
            </Pressable>
          ) : (
            <View style={[styles.iconCircle, { backgroundColor: C[iconBg] }]}>
              <Icon name={icon} size={32} color={iconColor} />
            </View>
          )
        ) : null}
        <View style={{ gap: gap[3], alignSelf: 'stretch' }}>
          <Txt t="heading/small" c="text/bolder" center accessibilityRole="header">
            {title}
          </Txt>
          {desc ? (
            <Txt t="body/small" c="text/subtle" center>
              {desc}
            </Txt>
          ) : null}
        </View>
        {extra}
        {children ? <View style={{ alignSelf: 'stretch', gap: gap[3] }}>{children}</View> : null}
      </Animated.View>
    </Animated.View>
  );
}

// 화면 아래쪽 검은 토스트 (임시 저장 등)
export function Toast({ text, bottom = 16 }: { text: string; bottom?: number }) {
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={[styles.toast, { bottom }]} accessibilityLiveRegion="polite">
      <Icon name="success-fill" size={20} color="icon/success" />
      <Txt t="body/small" c="text/inverse" style={{ flex: 1 }}>
        {text}
      </Txt>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C['surface/white'],
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: padding[3],
    paddingHorizontal: padding[8],
    gap: gap[6],
    alignItems: 'center',
  },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: C['border/gray-light'] },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  toast: {
    position: 'absolute',
    left: padding[8],
    right: padding[8],
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap[3],
    paddingVertical: padding[6],
    paddingHorizontal: padding[7],
    borderRadius: radius.large,
    backgroundColor: C['surface/inverse'],
  },
});
