import { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const STAGGER_MS = 70;
const DURATION_MS = 420;
const OFFSET_Y = 14;

// 처음 나타날 때 아래에서 살짝 떠오르며 서서히 보인다. order 순서대로 0.07초씩 늦게.
// 레이아웃 애니메이션(entering)은 웹에서 감싼 뷰의 높이를 고정해 버려 펼쳐지는 카드와 함께 쓰면
// 아래 카드가 밀려나지 않으므로, 투명도·위치(transform)만 움직인다.
export function Rise({
  order = 0,
  style,
  children,
}: {
  order?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const v = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    v.value = withDelay(80 + order * STAGGER_MS, withTiming(1, { duration: DURATION_MS, easing: Easing.out(Easing.cubic) }));
  }, [order, reduceMotion, v]);

  const animated = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [{ translateY: (1 - v.value) * OFFSET_Y }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
