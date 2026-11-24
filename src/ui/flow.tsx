import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';

import { api } from '@/api';
import { haptic } from '@/lib/haptics';
import { C, ColorToken, gap, padding, radius } from '@/theme/krds';
import { IconName } from '@/theme/icons';
import { Icon, StatusCircle, Txt } from '@/ui/primitives';
import { CheckBurst, NfcPulse } from '@/ui/sheet';

// 상태 표시 (카메라 잠금 · 잠금 해제). 상자 없이 화면 위에 바로 놓는다
//  - wait: 뒤로 물결이 퍼진다 (NFC 태그 팝업과 같은 모양)
//  - busy: 원 테두리를 따라 선이 돈다
//  - done: 초록 원이 튀어 오르고 체크가 돌며 들어온다
const STATUS_SIZE = 120;
export function StatusBox({ icon, color, title, desc, motion }: { icon: IconName; color: ColorToken; title: string; desc?: string; motion?: 'wait' | 'busy' | 'done' }) {
  const art =
    motion === 'done' ? (
      <CheckBurst size={STATUS_SIZE} />
    ) : motion === 'wait' ? (
      <NfcPulse size={STATUS_SIZE} icon={icon} color={color} bg="surface/white" />
    ) : (
      <View style={{ width: STATUS_SIZE, height: STATUS_SIZE, alignItems: 'center', justifyContent: 'center' }}>
        {motion === 'busy' ? <SpinRing size={STATUS_SIZE} /> : null}
        <StatusCircle icon={icon} color={color} bg="surface/white" size={STATUS_SIZE - 16} />
      </View>
    );
  return (
    <View style={styles.statusBox}>
      <Animated.View key={icon + title} entering={ZoomIn.duration(260)}>
        {art}
      </Animated.View>
      <Txt t="body/medium-bold" center>
        {title}
      </Txt>
      {desc ? (
        <Txt t="body/small" c="text/subtle" center>
          {desc}
        </Txt>
      ) : null}
    </View>
  );
}

// 원 테두리를 따라 도는 선 (확인 중)
function SpinRing({ size }: { size: number }) {
  const reduce = useReducedMotion();
  const r = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    r.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(r);
  }, [reduce, r]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value * 360}deg` }] }));
  return <Animated.View style={[StyleSheet.absoluteFill, styles.spin, { borderRadius: size / 2 }, spin]} />;
}

// 완료 화면 머리 (체크 · 제목 · 부제)
export function SuccessHero({ title, sub }: { title: string; sub?: string }) {
  useEffect(() => haptic.success(), []);
  return (
    <View style={{ alignItems: 'center', gap: gap[3] }}>
      <Animated.View entering={ZoomIn.duration(320)}>
        <Icon name="success-fill" size={56} color="icon/success" />
      </Animated.View>
      <Txt t="heading/medium" c="text/bolder" center accessibilityRole="header">
        {title}
      </Txt>
      {sub ? (
        <Txt t="body/small" c="text/subtle" center>
          {sub}
        </Txt>
      ) : null}
    </View>
  );
}

// 장비 목록 (수령 · 반납 공용). current 줄에 NFC 대기 원이 붙는다.
export function EquipmentList({
  done,
  verb,
  onTag,
}: {
  done: number;
  verb: '수령' | '반납';
  onTag?: () => void;
}) {
  const items = api.equipment();
  const all = done >= items.length;
  return (
    <View style={styles.list}>
      <View style={styles.listHead}>
        <Txt t="body/small" c="text/subtle">
          {all ? `${verb === '수령' ? '받은' : '반납한'} 장비` : `지금 ${verb === '수령' ? '받을' : '반납할'} 장비`}
        </Txt>
        <Txt t="heading/xsmall" c={all ? 'text/success' : 'text/primary'}>
          {done} / {items.length}
        </Txt>
      </View>
      {items.map((it, i) => {
        const state = i < done ? 'done' : i === done ? 'now' : 'wait';
        return (
          <View key={it.id}>
            <View style={[styles.item, state === 'now' && styles.itemNow]}>
              <View style={[styles.num, { backgroundColor: C[state === 'wait' ? 'element/gray-light' : 'element/primary'] }]}>
                <Txt t="body/xsmall-bold" c={state === 'wait' ? 'text/subtle' : 'text/inverse'}>
                  {String(i + 1).padStart(2, '0')}
                </Txt>
              </View>
              <Txt t={state === 'wait' ? 'body/medium' : 'body/medium-bold'} c={state === 'wait' ? 'text/subtle' : 'text/basic'} style={{ flex: 1 }}>
                {it.name}
              </Txt>
              <Txt t="body/small-bold" c={state === 'done' ? 'text/success' : state === 'now' ? 'text/primary' : 'text/subtle'}>
                {state === 'done' ? `${verb} 완료` : state === 'now' ? `${verb} 중` : '대기'}
              </Txt>
            </View>
            {state === 'now' && onTag ? <TagPrompt onTag={onTag} /> : null}
          </View>
        );
      })}
    </View>
  );
}

// NFC 태그 안내 (장비·총기 지급대 공용). 시연에서는 원을 눌러도 태그된 것으로 친다.
function TagPrompt({ label = '태그에 휴대폰을 대 주세요', onTag }: { label?: string; onTag: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(240)} style={styles.nfc}>
      <Pressable onPress={onTag} accessibilityRole="button" accessibilityLabel="태그하기">
        <NfcPulse />
      </Pressable>
      <Txt t="body/medium-bold" c="text/primary">
        {label}
      </Txt>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // 남은 세로 공간을 채우고 그 가운데에 놓는다
  spin: { borderWidth: 3, borderColor: 'transparent', borderTopColor: C['element/primary'], borderRightColor: C['element/primary'] },
  statusBox: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: gap[3], paddingVertical: padding[9] },
  list: { padding: padding[6], gap: gap[2], borderRadius: radius.xlarge, borderWidth: 1, borderColor: C['border/gray-light'], backgroundColor: C['surface/white'] },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: padding[3], paddingHorizontal: padding[2] },
  item: { flexDirection: 'row', alignItems: 'center', gap: gap[4], paddingVertical: padding[5], paddingHorizontal: padding[6], borderRadius: radius.large },
  itemNow: { backgroundColor: C['surface/primary-subtler'], borderWidth: 1, borderColor: C['border/primary'] },
  num: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  nfc: { alignItems: 'center', gap: gap[4], paddingVertical: padding[6] },
});
