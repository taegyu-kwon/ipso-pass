import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextProps, View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { haptic } from '@/lib/haptics';
import { C, ColorToken, gap, padding, radius, TextToken, type } from '@/theme/krds';
import { iconXml, IconName } from '@/theme/icons';

// ── 글자 ────────────────────────────────────────────────
export function Txt({
  t = 'body/medium',
  c = 'text/basic',
  center,
  style,
  ...rest
}: TextProps & { t?: TextToken; c?: ColorToken; center?: boolean }) {
  return <Text {...rest} style={[type(t), { color: C[c] }, center && { textAlign: 'center' }, style]} />;
}

// ── 아이콘 ──────────────────────────────────────────────
export function Icon({ name, size = 24, color = 'icon/gray' }: { name: IconName; size?: number; color?: ColorToken }) {
  return <SvgXml xml={iconXml(name)} width={size} height={size} color={C[color]} />;
}

// ── 버튼 (KRDS Button: Primary / Secondary / Tertiary / Text, L 56 · M 48 · S 40) ──
type ButtonType = 'primary' | 'secondary' | 'tertiary' | 'text';
type ButtonSize = 'L' | 'M' | 'S';

const BTN = {
  primary: { bg: 'button/primary-fill', pressed: 'button/primary-fill-pressed', border: null, text: 'text/inverse' },
  secondary: { bg: 'button/secondary-fill', pressed: 'button/secondary-fill-pressed', border: 'button/secondary-border', text: 'text/primary' },
  tertiary: { bg: null, pressed: 'button/tertiary-fill-pressed', border: 'button/tertiary-border', text: 'text/basic' },
  text: { bg: null, pressed: 'button/tertiary-fill-pressed', border: null, text: 'text/basic' },
} as const;
const SIZE = {
  L: { h: 56, px: 24, r: radius.medium3, t: 'body/large-bold' },
  M: { h: 48, px: 20, r: radius.medium3, t: 'body/medium-bold' },
  S: { h: 40, px: 16, r: radius.medium1, t: 'body/small-bold' },
} as const;

export function Button({
  label,
  onPress,
  kind = 'primary',
  size = 'L',
  disabled,
  icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  kind?: ButtonType;
  size?: ButtonSize;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const v = BTN[kind];
  const s = SIZE[size];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptic.tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        { height: s.h, paddingHorizontal: s.px, borderRadius: s.r },
        disabled
          ? { backgroundColor: C['button/disabled-fill'] }
          : {
              backgroundColor: pressed ? C[v.pressed] : v.bg ? C[v.bg] : 'transparent',
              borderWidth: v.border ? 1 : 0,
              borderColor: v.border ? C[v.border] : undefined,
            },
        style,
      ]}>
      {icon ? <Icon name={icon} size={20} color={disabled ? 'icon/disabled' : kind === 'primary' ? 'icon/inverse' : kind === 'secondary' ? 'icon/primary' : 'icon/gray'} /> : null}
      <Txt t={s.t} c={disabled ? 'text/disabled-on' : v.text}>
        {label}
      </Txt>
    </Pressable>
  );
}

// ── 배지 (KRDS Badge) ───────────────────────────────────
export type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'information' | 'gray';
const TONE: Record<Tone, { bg: ColorToken; border: ColorToken; text: ColorToken; icon: ColorToken }> = {
  primary: { bg: 'surface/primary-subtler', border: 'border/primary-light', text: 'text/primary', icon: 'icon/primary' },
  success: { bg: 'surface/success-subtler', border: 'border/success-light', text: 'text/success', icon: 'icon/success' },
  warning: { bg: 'surface/warning-subtler', border: 'border/warning-light', text: 'text/warning', icon: 'icon/warning' },
  danger: { bg: 'surface/danger-subtler', border: 'border/danger-light', text: 'text/danger', icon: 'icon/danger' },
  information: { bg: 'surface/information-subtler', border: 'border/information-light', text: 'text/information', icon: 'icon/information' },
  gray: { bg: 'surface/gray-subtler', border: 'border/gray-light', text: 'text/subtle', icon: 'icon/gray' },
};
export const toneOf = (t: Tone) => TONE[t];

export function Badge({ label, tone = 'gray' }: { label: string; tone?: Tone }) {
  const v = TONE[tone];
  return (
    <View style={[styles.badge, { backgroundColor: C[v.bg], borderColor: C[v.border] }]}>
      <Txt t="body/xsmall-bold" c={v.text}>
        {label}
      </Txt>
    </View>
  );
}

// ── 안내 (KRDS Notice) ──────────────────────────────────
const NOTICE_ICON: Record<'information' | 'warning' | 'danger' | 'success', IconName> = {
  information: 'information-fill',
  warning: 'warning-fill',
  danger: 'error-fill',
  success: 'success-fill',
};

export function Notice({
  tone = 'information',
  title,
  body,
}: {
  tone?: 'information' | 'warning' | 'danger' | 'success';
  title: string;
  body?: string;
}) {
  const v = TONE[tone];
  return (
    <View style={[styles.notice, { backgroundColor: C[v.bg], borderColor: C[v.border] }]}>
      <Icon name={NOTICE_ICON[tone]} size={20} color={tone === 'warning' ? 'element/warning' : v.icon} />
      <View style={{ flex: 1, gap: gap[1] }}>
        <Txt t="body/small-bold" c={v.text}>
          {title}
        </Txt>
        {body ? <Txt t="body/small">{body}</Txt> : null}
      </View>
    </View>
  );
}

// ── 카드 ────────────────────────────────────────────────
export function Card({
  children,
  style,
  pad = padding[7],
  tone,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  pad?: number;
  tone?: 'primary' | 'gray';
}) {
  return (
    <View
      style={[
        styles.card,
        { padding: pad },
        tone === 'primary' && { borderColor: C['border/primary-light'] },
        tone === 'gray' && { backgroundColor: C['surface/gray-subtler'], borderWidth: 0 },
        style,
      ]}>
      {children}
    </View>
  );
}

// 왼쪽 라벨 · 오른쪽 값 한 줄
export function KV({ k, v, bold, c }: { k: string; v: string; bold?: boolean; c?: ColorToken }) {
  return (
    <View style={styles.kv}>
      <Txt t="body/small" c="text/subtle" style={{ width: 96 }}>
        {k}
      </Txt>
      <Txt t={bold ? 'body/medium-bold' : 'body/medium'} c={c} style={{ flex: 1 }}>
        {v}
      </Txt>
    </View>
  );
}

// 가로 막대 진행률
export function ProgressBar({ value, total }: { value: number; total: number }) {
  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: value }}>
      <View style={[styles.fill, { width: `${(value / total) * 100}%` }]} />
    </View>
  );
}

// 목록 한 줄 (제목 · 설명 · 배지 · 화살표)
export function ListRow({
  title,
  desc,
  badge,
  onPress,
  leading,
}: {
  title: string;
  desc?: string;
  badge?: { label: string; tone: Tone };
  onPress?: () => void;
  leading?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: C['surface/gray-subtler'] }]}>
      {leading ? <Icon name={leading} color="icon/primary" /> : null}
      <View style={{ flex: 1, gap: gap[1] }}>
        <Txt t="body/medium-bold">{title}</Txt>
        {desc ? <Txt t="body/small" c="text/subtle">{desc}</Txt> : null}
      </View>
      {badge ? <Badge {...badge} /> : null}
      {onPress ? <Icon name="chevron-right" size={20} color="icon/gray-light" /> : null}
    </Pressable>
  );
}

// 선택 탭 (예비군/담당자 모드, 개인/생활관/조). HDMI 화면에서도 읽히게 글자를 크게 둔다.
export function Segmented<V extends string>({ options, value, onChange }: { options: { value: V; label: string }[]; value: V; onChange: (v: V) => void }) {
  return (
    <View style={styles.segmented} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => {
              haptic.tap();
              onChange(o.value);
            }}
            style={[styles.segment, on && { backgroundColor: C['button/primary-fill'] }]}>
            <Txt t="body/large-bold" c={on ? 'text/inverse' : 'text/subtle'}>
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

// 상태 아이콘이 든 원 (보안 확인, 완료 화면)
export function StatusCircle({ icon, color, bg = 'surface/white', size = 72 }: { icon: IconName; color: ColorToken; bg?: ColorToken; size?: number }) {
  return (
    <View style={[styles.circle, { width: size, height: size, backgroundColor: C[bg] }]}>
      <Icon name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: gap[2],
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: padding[3],
    paddingVertical: padding[1],
    borderRadius: radius.small,
    borderWidth: 1,
  },
  notice: {
    flexDirection: 'row',
    gap: gap[3],
    padding: padding[6],
    borderRadius: radius.large,
    borderWidth: 1,
  },
  card: {
    backgroundColor: C['surface/white'],
    borderRadius: radius.xlarge,
    borderWidth: 1,
    borderColor: C['border/gray-light'],
    gap: gap[4],
  },
  kv: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: gap[5],
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: C['element/gray-light'],
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: C['element/primary'],
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap[4],
    paddingVertical: padding[5],
    paddingHorizontal: padding[6],
    borderRadius: radius.large,
  },
  segmented: {
    flexDirection: 'row',
    gap: gap[2],
    padding: padding[2],
    borderRadius: radius.xlarge,
    borderWidth: 1,
    borderColor: C['border/gray-light'],
    backgroundColor: C['surface/white'],
  },
  segment: {
    flex: 1,
    height: 52,
    borderRadius: radius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    borderRadius: radius.max,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
