import { Href, router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { haptic } from '@/lib/haptics';
import { setMode } from '@/state/admin';
import { C, gap, padding, radius } from '@/theme/krds';
import { IconName } from '@/theme/icons';
import { BackBar, Screen } from '@/ui/layout';
import { Icon, Txt } from '@/ui/primitives';

const MENU: { label: string; desc: string; icon: IconName; href: Href }[] = [
  { label: '예비군 호출', desc: '개인 · 생활관 · 조로 바로 불러요', icon: 'bell', href: '/admin-call' },
  { label: '태그 등록', desc: '입소 · 총기 · 물자 태그를 등록해요', icon: 'nfc', href: '/admin-tag' },
];

// 담당자 홈 (시연 패널의 '화면 모드'에서 연다). 이 화면이 떠 있는 동안 앱은 담당자 모드이고, 뒤로 가면 예비군 홈이다.
export default function AdminHome() {
  useEffect(() => {
    setMode('admin');
    return () => setMode('reservist');
  }, []);

  return (
    <Screen bar={<BackBar title="담당자" />}>
      <Txt t="heading/large" c="text/bolder" accessibilityRole="header">
        무엇을 할까요?
      </Txt>
      {MENU.map((m) => (
        <Pressable
          key={m.label}
          accessibilityRole="button"
          onPress={() => {
            haptic.tap();
            router.push(m.href);
          }}
          style={({ pressed }) => [styles.menu, pressed && { backgroundColor: C['surface/gray-subtler'] }]}>
          <View style={styles.menuIcon}>
            <Icon name={m.icon} size={28} color="icon/primary" />
          </View>
          <View style={{ flex: 1, gap: gap[1] }}>
            <Txt t="heading/medium" c="text/bolder">
              {m.label}
            </Txt>
            <Txt t="body/small" c="text/subtle">
              {m.desc}
            </Txt>
          </View>
          <Icon name="chevron-right" color="icon/gray-light" />
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  menu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap[5],
    padding: padding[7],
    borderRadius: radius.xlarge,
    borderWidth: 1,
    borderColor: C['border/gray-light'],
    backgroundColor: C['surface/white'],
  },
  menuIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.max,
    backgroundColor: C['surface/primary-subtler'],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
