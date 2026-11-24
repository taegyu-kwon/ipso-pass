import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/lib/haptics';
import { C, ColorToken, gap, MAX_APP_WIDTH, padding } from '@/theme/krds';
import { Icon, Txt } from '@/ui/primitives';

const emblem = require('@/assets/emblem.svg');

// 모든 화면의 공통 틀: 상태바 여백 · 앱바 · 스크롤 본문 · 하단 버튼 영역 · 겹치는 레이어(시트)
export function Screen({
  children,
  bar,
  footer,
  overlay,
  bg = 'background/gray-subtler',
  scroll = true,
  center,
  contentStyle,
}: {
  children: ReactNode;
  bar?: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
  bg?: ColorToken;
  scroll?: boolean;
  center?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  // 아래 버튼이 없으면 홈 인디케이터 위로 여백을 둔다
  const body = [styles.body, !footer && { paddingBottom: Math.max(insets.bottom, padding[6]) + 8 }, center && styles.center, contentStyle];
  return (
    <View style={[styles.page, { backgroundColor: C[bg] }]}>
      <StatusBar style="dark" />
      {/* 입력 칸에 키보드가 올라오면 본문과 하단 버튼을 키보드 위로 올린다 */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.app, { backgroundColor: C[bg] }]}>
        <View style={{ height: insets.top, backgroundColor: C['surface/white'] }} />
        {bar}
        {scroll ? (
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={[body, { flexGrow: 1 }]} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, body]}>{children}</View>
        )}
        {footer ? <View style={[styles.footer, { backgroundColor: C[bg], paddingBottom: Math.max(insets.bottom, padding[6]) + 8 }]}>{footer}</View> : null}
        {overlay}
      </KeyboardAvoidingView>
    </View>
  );
}

// 뒤로 가기 + 가운데 제목 앱바 (KRDS App bar · Type=Back)
export function BackBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="뒤로 가기"
        hitSlop={8}
        onPress={() => {
          haptic.tap();
          if (onBack) onBack();
          else if (router.canGoBack()) router.back();
          else router.replace('/');
        }}
        style={styles.barButton}>
        <Icon name="chevron-left" />
      </Pressable>
      <Txt t="navigation/title-small" c="text/bolder" style={styles.barTitle} numberOfLines={1}>
        {title}
      </Txt>
      <View style={styles.barButton}>{right}</View>
    </View>
  );
}

// 탭 화면용 제목 앱바 (뒤로 가기 없음)
export function TitleBar({ title }: { title: string }) {
  return (
    <View style={styles.bar}>
      <View style={styles.barButton} />
      <Txt t="navigation/title-small" c="text/bolder" style={styles.barTitle}>
        {title}
      </Txt>
      <View style={styles.barButton} />
    </View>
  );
}

// 홈 앱바 (엠블럼 · 예비군 · 알림 · 내 정보). 엠블럼을 길게 누르면 시연 패널이 열린다.
export function HomeBar() {
  return (
    <View style={[styles.bar, { justifyContent: 'center' }]}>
      <Pressable
        onLongPress={() => {
          haptic.success();
          router.push('/demo');
        }}
        delayLongPress={600}
        accessibilityLabel="예비군"
        style={styles.brand}>
        <Image source={emblem} style={{ width: 28, height: 30 }} contentFit="contain" />
        <Txt t="heading/small" c="text/bolder">
          예비군
        </Txt>
      </Pressable>
      {/* 웹 체험판: 마우스로는 길게 누르기를 알기 어려워 시연 패널 버튼을 보이게 둔다 */}
      {Platform.OS === 'web' ? (
        <Pressable onPress={() => router.push('/demo')} accessibilityRole="button" accessibilityLabel="시연 패널 열기" style={styles.demoButton}>
          <Txt t="body/small-bold" c="text/primary">
            시연 패널
          </Txt>
        </Pressable>
      ) : null}
    </View>
  );
}

// 단계 머리: 진행 막대 · 구간 이름과 순서 · 큰 제목
export function StepHead({ label, index, total, title }: { label: string; index: number; total: number; title: string }) {
  return (
    <View style={{ gap: gap[4] }}>
      <View style={styles.segments}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={[styles.segment, { backgroundColor: C[i < index ? 'element/primary' : 'element/gray-light'] }]} />
        ))}
      </View>
      <View style={styles.stepRow}>
        <Txt t="body/small-bold" c="text/primary">
          {label}
        </Txt>
        <Txt t="body/small-bold" c="text/subtle">
          {index} / {total}
        </Txt>
      </View>
      <Txt t="heading/large" c="text/bolder" accessibilityRole="header">
        {title}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  app: { flex: 1, width: '100%', maxWidth: MAX_APP_WIDTH, alignSelf: 'center', overflow: 'hidden' },
  body: { paddingHorizontal: padding[8], paddingVertical: padding[6], gap: gap[6] },
  center: { justifyContent: 'center' },
  footer: {
    paddingHorizontal: padding[8],
    paddingTop: padding[6],
    gap: gap[3],
  },
  bar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: padding[3],
    backgroundColor: C['surface/white'],
  },
  barButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  barTitle: { flex: 1, textAlign: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: gap[3] },
  demoButton: { position: 'absolute', right: padding[8], height: 48, justifyContent: 'center' },
  segments: { flexDirection: 'row', gap: gap[2] },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
