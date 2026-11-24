import { useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, SharedValue, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Pattern, Rect, Stop, SvgXml, Text as SvgText } from 'react-native-svg';

import { EMBLEM_GHOST_XML } from '@/theme/emblem-ghost';
import { C, gap, padding, radius } from '@/theme/krds';
import { Txt } from '@/ui/primitives';

// 담당자에게 보여 주는 입소패스의 위조 방지 장식.
//  - 보안 띠: 글자가 계속 흐르고 시계가 초 단위로 간다. 캡처한 화면은 멈춰 있어 바로 구별된다.
//  - 배경: 남색 바탕, 천천히 도는 로제트, 흐르는 물결·작은 글씨, 흐린 엠블럼. 움직여서 캡처와 구별된다.

const UNIT = '대한민국 예비군 · REPUBLIC OF KOREA RESERVE FORCES · ';
const pad = (n: number) => String(n).padStart(2, '0');

export function LiveBand({ dark }: { dark?: boolean }) {
  const reduce = useReducedMotion();
  const [now, setNow] = useState(() => new Date());
  const [unitW, setUnitW] = useState(0);
  const x = useSharedValue(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (reduce || !unitW) return;
    x.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.linear }), -1, false);
  }, [reduce, unitW, x]);
  const run = useAnimatedStyle(() => ({ transform: [{ translateX: -x.value * unitW }] }));

  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return (
    <View
      style={[styles.band, dark && { backgroundColor: C['pass/charcoal-deep'] }]}
      accessible
      accessibilityLabel={`실시간 확인 ${time}`}>
      <View style={styles.marqueeClip} importantForAccessibility="no-hide-descendants">
        <Animated.View style={[styles.marquee, run]}>
          {[0, 1, 2].map((i) => (
            <Txt
              key={i}
              t="body/xsmall-bold"
              c={dark ? 'pass/subtle' : 'pass/accent'}
              style={{ opacity: 0.6, flexShrink: 0 }}
              onLayout={i === 0 ? (e: LayoutChangeEvent) => setUnitW(e.nativeEvent.layout.width) : undefined}>
              {UNIT}
            </Txt>
          ))}
        </Animated.View>
      </View>
      <View style={styles.clock}>
        {/* 초마다 깜빡이는 점: 화면이 살아 있다는 표시 */}
        <View style={[styles.dot, { opacity: now.getSeconds() % 2 ? 0.35 : 1 }, dark && { backgroundColor: C['pass/subtle'] }]} />
        <Txt t="body/small-bold" c="text/inverse" style={{ fontVariant: ['tabular-nums'] }}>
          {time}
        </Txt>
      </View>
    </View>
  );
}

// 남색 패스 배경 (신분증·면허증 바탕처럼 짙은 바탕 위에 같은 톤의 무늬만)
//  - 위에서 아래로 짙어지는 남색
//  - 엠블럼을 감싸는 로제트 고리: 이웃한 고리끼리 반대로 천천히 돈다
//  - 로제트 바깥: 비스듬한 물결 선과 그 사이 작은 글씨가 한 방향으로 계속 흐른다
//  - 오른쪽 가장자리에 걸친 큰 엠블럼 윤곽 (흰색으로 아주 옅게)
//  사용 불가 패스는 같은 구성을 짙은 회색으로. 동작 줄이기 설정이면 멈춰 있다.

// 엠블럼 자리 (styles.ghost와 같은 값). right는 카드 오른쪽 밖으로 걸친 만큼, top은 높이 비율
const EMBLEM = { right: 90, top: 0.24, w: 240, h: 262 };
// 로제트: 고리마다 r = R + A·sin(kθ + 위상)인 곡선 여러 가닥을 겹친다.
// 엠블럼(반지름 약 131)과 겹치지 않게 160부터 EDGE 안쪽까지만, 바깥 고리일수록 옅다.
// 고리마다 물결 길이를 약 36pt로 맞춰 안쪽·바깥 고리의 결이 같다
const EDGE = 282;
const BANDS = Array.from({ length: 6 }, (_, b) => {
  const R = 160 + b * 20;
  const A = 5 + b * 0.4;
  const k = Math.round((2 * Math.PI * R) / 36);
  const paths = Array.from({ length: 6 }, (_, j) => {
    // 가닥끼리 위상을 한 물결 전체에 고르게 나눠 그물처럼 엮이게
    const phase = (j / 6) * 2 * Math.PI;
    let d = '';
    for (let i = 0; i <= 720; i++) {
      const t = (i / 720) * 2 * Math.PI;
      const r = R + A * Math.sin(k * t + phase);
      d += `${i ? 'L' : 'M'}${(r * Math.cos(t)).toFixed(1)} ${(r * Math.sin(t)).toFixed(1)} `;
    }
    return d + 'Z';
  });
  return { half: Math.ceil(R + A + 1), paths, o: 0.075 - b * 0.004 };
});

// 물결 사이 작은 글씨
const MICRO = '대한민국 예비군 · REPUBLIC OF KOREA RESERVE FORCES · ';
const MICRO_SIZE = 3.6;
// 한 벌을 낱말(뒤 공백 포함)로 나눈 조각
const WORDS = MICRO.match(/\S+\s*/g) ?? [MICRO];
// shortcut: 글자 폭은 한글 1em·그 밖 0.68em·공백류 0.5em 근사 (낱말마다 이 길이에 맞춰 늘이고 줄인다)
const advance = (ch: string) => MICRO_SIZE * (/[가-힣]/.test(ch) ? 1 : /[ ·]/.test(ch) ? 0.5 : 0.68);
// 흐름 한 주기: 글씨 한 벌의 가로 길이. 물결 길이도 이 값을 나눠떨어지게 맞춰
// (U, 0.4U)만큼 옮기면 무늬가 그대로 겹친다 → 끊김 없이 반복된다.
const U = [...MICRO].reduce((a, ch) => a + advance(ch), 0);
const WAVE = U / Math.max(1, Math.round(U / 100));
const SLOPE = 0.4;
// 5줄마다 글씨 시작점이 되풀이되고, 줄 간격을 (U, 0.4U)가 정확히 5줄이 되게 맞추면
// 무늬가 가로 U × 세로 0.4U 직사각형 한 칸으로 반복된다
const ROWS = 5;
const FLOW_GAP = (SLOPE * U) / ROWS;
const TILE_H = SLOPE * U;
const waveY = (y0: number, x: number) => y0 + x * SLOPE + 3 * Math.sin((2 * Math.PI * x) / WAVE);
const wordLen = (word: string) => [...word].reduce((a, ch) => a + advance(ch), 0);

// 흐름 무늬 한 칸. 카드 전체를 글씨 조각 수천 개로 그리면 첫 표시가 늦어, 한 칸만 그려 패턴으로 깐다.
const TILE = (() => {
  const lines: string[] = [];
  const chunks: { text: string; x: number; y: number; deg: number; len: number }[] = [];
  // 칸에 걸치는 줄은 모두 (칸 밖으로 넘친 부분은 패턴이 잘라 낸다)
  for (let r = -ROWS - 2; r <= ROWS + 1; r++) {
    const y0 = r * FLOW_GAP;
    let d = '';
    const steps = Math.ceil(U / 4);
    for (let i = 0; i <= steps; i++) {
      const x = (U * i) / steps;
      d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${waveY(y0, x).toFixed(1)} `;
    }
    lines.push(d);
    // 줄 사이 가운데에 낱말 단위로. 주기마다 똑같이 놓여 칸 경계에서 이어 붙여도 어긋나지 않는다
    const mid = y0 + FLOW_GAP / 2 + MICRO_SIZE * 0.35;
    for (let u0 = -U - (((r % ROWS) + ROWS) % ROWS) * 9; u0 <= U; u0 += U) {
      let x = u0;
      for (const word of WORDS) {
        const x1 = x;
        const x2 = x1 + wordLen(word.trimEnd()); // 글자가 차지하는 끝 (뒤 공백 빼고)
        x += wordLen(word);
        const [ya, yb] = [waveY(mid, x1), waveY(mid, x2)];
        if (x2 < -4 || x1 > U + 4 || Math.max(ya, yb) < -6 || Math.min(ya, yb) > TILE_H + 6) continue; // 칸 밖 조각
        chunks.push({
          text: word.trimEnd(),
          x: +x1.toFixed(2),
          y: +ya.toFixed(2),
          deg: +((Math.atan2(yb - ya, x2 - x1) * 180) / Math.PI).toFixed(2),
          // 실제 글자 폭과 달라도 정해 둔 길이에 맞춰 그려 주기가 어긋나지 않게
          len: +Math.hypot(x2 - x1, yb - ya).toFixed(2),
        });
      }
    }
  }
  return { lines, chunks };
})();

// 한 바퀴(흐름은 FLOW_LOOPS 주기)에 걸리는 시간
const CYCLE_MS = 120000;
const FLOW_LOOPS = 12;

function Ring({ band, cx, cy, dir, t }: { band: (typeof BANDS)[number]; cx: number; cy: number; dir: 1 | -1; t: SharedValue<number> }) {
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${dir * t.value * 360}deg` }] }));
  const size = band.half * 2;
  return (
    <Animated.View style={[{ position: 'absolute', left: cx - band.half, top: cy - band.half, width: size, height: size }, spin]}>
      <Svg width={size} height={size}>
        <G fill="none" stroke="#ffffff" strokeWidth={0.5} strokeOpacity={band.o} transform={`translate(${band.half} ${band.half})`}>
          {band.paths.map((d, i) => (
            <Path key={i} d={d} />
          ))}
        </G>
      </Svg>
    </Animated.View>
  );
}

export function Watermark({ dark }: { dark?: boolean }) {
  const reduce = useReducedMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const { w, h } = size;
  const top = C[dark ? 'pass/charcoal' : 'pass/navy'];
  const bottom = C[dark ? 'pass/charcoal-deep' : 'pass/navy-deep'];
  const cx = w + EMBLEM.right - EMBLEM.w / 2;
  const cy = h * EMBLEM.top + EMBLEM.h / 2;

  const t = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    t.value = withRepeat(withTiming(1, { duration: CYCLE_MS, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [reduce, t]);
  const drift = useAnimatedStyle(() => {
    const s = (t.value * FLOW_LOOPS) % 1;
    return { transform: [{ translateX: s * U }, { translateY: s * U * SLOPE }] };
  });

  // 바탕과 로제트 덮개가 같은 그라데이션을 쓰도록 카드 좌표로 고정
  const gradient = (
    <LinearGradient id="navy" gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={w * 0.4} y2={h}>
      <Stop offset="0" stopColor={top} />
      <Stop offset="1" stopColor={bottom} />
    </LinearGradient>
  );

  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {/* 크기를 잰 뒤 바탕·무늬·엠블럼을 한 번에 보여 준다 (엠블럼만 먼저 뜨지 않게) */}
      {w ? (
        <View style={StyleSheet.absoluteFill}>
          <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
            <Defs>{gradient}</Defs>
            <Rect x={0} y={0} width={w} height={h} fill="url(#navy)" />
          </Svg>
          {/* 흐르는 층: 물결 선과 작은 글씨 */}
          <Animated.View style={[{ position: 'absolute', left: -U, top: -U * SLOPE }, drift]}>
            <Svg width={w + U} height={h + U * SLOPE}>
              <Defs>
                <Pattern id="flow" patternUnits="userSpaceOnUse" width={U} height={TILE_H}>
                  <G fill="none" stroke="#ffffff" strokeWidth={0.5} strokeOpacity={0.065}>
                    {TILE.lines.map((d, i) => (
                      <Path key={`f${i}`} d={d} />
                    ))}
                  </G>
                  {TILE.chunks.map((m, i) => (
                    <SvgText
                      key={`mt${i}`}
                      transform={`translate(${m.x} ${m.y}) rotate(${m.deg})`}
                      textLength={m.len}
                      lengthAdjust="spacingAndGlyphs"
                      fontSize={MICRO_SIZE}
                      fill="#ffffff"
                      fillOpacity={0.12}>
                      {m.text}
                    </SvgText>
                  ))}
                </Pattern>
              </Defs>
              <Rect x={0} y={0} width={w + U} height={h + U * SLOPE} fill="url(#flow)" />
            </Svg>
          </Animated.View>
          {/* 로제트 자리를 바탕색으로 덮어 흐르는 층을 가리고, 테두리 두 줄 */}
          <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
            <Defs>{gradient}</Defs>
            <Circle cx={cx} cy={cy} r={EDGE} fill="url(#navy)" />
            <G fill="none" stroke="#ffffff" strokeWidth={0.5}>
              <Circle cx={cx} cy={cy} r={EDGE} strokeOpacity={0.12} />
              <Circle cx={cx} cy={cy} r={EDGE - 4} strokeOpacity={0.08} />
            </G>
          </Svg>
          {BANDS.map((band, b) => (
            <Ring key={b} band={band} cx={cx} cy={cy} dir={b % 2 ? -1 : 1} t={t} />
          ))}
          <View style={styles.ghost}>
            <SvgXml xml={EMBLEM_GHOST_XML} width="100%" height="100%" />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap[3],
    height: 44,
    paddingLeft: padding[6],
    paddingRight: padding[3],
    backgroundColor: C['pass/navy-deep'],
    borderTopWidth: 1,
    borderTopColor: C['pass/line'],
  },
  marqueeClip: { flex: 1, overflow: 'hidden' },
  // 글자 세 덩어리가 줄바꿈·말줄임 없이 들어갈 만큼 넓게
  marquee: { flexDirection: 'row', width: 1200 },
  clock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap[2],
    paddingHorizontal: padding[4],
    paddingVertical: padding[2],
    borderRadius: radius.max,
    backgroundColor: C['pass/fill'],
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5fd38d' },
  // 오른쪽 가장자리에 크게 걸쳐 아주 옅게
  ghost: { position: 'absolute', right: -EMBLEM.right, top: `${EMBLEM.top * 100}%`, width: EMBLEM.w, height: EMBLEM.h, opacity: 0.045 },
});
