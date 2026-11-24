import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { api } from '@/api';
import { MODES, useMode } from '@/state/admin';
import { DAYS, Journey, ScenarioKey, SCENARIOS, useJourney } from '@/state/journey';
import { C, gap, padding, radius } from '@/theme/krds';
import { BackBar, Screen } from '@/ui/layout';
import { Card, ListRow, Segmented, Txt } from '@/ui/primitives';

type Sim = Journey['sim'];

// 인물마다 보여 주기 좋은 장면. 고르면 그 장면부터 다시 시작한다.
const PERSONA_SCENE: Record<string, ScenarioKey> = { r4: 'changed', r5: 'todayCheck' };

function Choice<K extends keyof Sim>({ label, k, options }: { label: string; k: K; options: [Sim[K], string][] }) {
  const { j, update } = useJourney();
  return (
    <View style={{ gap: gap[3] }}>
      <Txt t="body/small-bold">{label}</Txt>
      <View style={styles.chips}>
        {options.map(([v, text]) => {
          const on = j.sim[k] === v;
          return (
            <Pressable
              key={String(v)}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              onPress={() => update((x) => ({ ...x, sim: { ...x.sim, [k]: v } }))}
              style={[styles.chip, on && styles.chipOn]}>
              <Txt t="body/small-bold" c={on ? 'text/primary' : 'text/basic'}>
                {text}
              </Txt>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// 시연 패널: 홈 엠블럼을 길게 누르면 열린다. 원하는 장면으로 바로 가고, 실패 상황을 미리 고른다.
export default function Demo() {
  const { j, load, setDay, update } = useJourney();
  const mode = useMode();
  return (
    <Screen bar={<BackBar title="시연 패널" />}>
      <Txt t="body/small" c="text/subtle">
        실제 서비스에는 없는 시연용 화면이에요. 장면을 고르면 홈으로 돌아가요.
      </Txt>
      <Card style={{ gap: gap[4] }}>
        <Txt t="heading/xsmall" c="text/bolder">
          화면 모드
        </Txt>
        <Txt t="body/small" c="text/subtle">
          실제로는 담당자 계정으로 로그인하면 담당자 메뉴가 열려요.
        </Txt>
        <Segmented
          options={MODES}
          value={mode}
          onChange={(m) => {
            router.dismissTo('/');
            if (m === 'admin') router.push('/admin');
          }}
        />
      </Card>
      <Txt t="body/small-bold" c="text/subtle">
        인물 (더미 데이터 · 훈련장은 국방부 실제 데이터)
      </Txt>
      <Card pad={4} style={{ gap: gap[1] }}>
        {api.reservists().map((r) => {
          const scene = PERSONA_SCENE[r.id] ?? 'd1New';
          return (
            <ListRow
              key={r.id}
              title={`${r.name} · ${r.yearLabel}`}
              desc={SCENARIOS[scene].label}
              badge={j.reservistId === r.id ? { label: '지금', tone: 'primary' } : undefined}
              onPress={() => {
                update((x) => ({ ...SCENARIOS[scene].make(), sim: x.sim, reservistId: r.id }));
                router.dismissTo('/');
              }}
            />
          );
        })}
      </Card>
      <Card style={{ gap: gap[4] }}>
        <Txt t="heading/xsmall" c="text/bolder">
          시연 시계
        </Txt>
        <Txt t="body/small" c="text/subtle">
          작성한 내용은 그대로 두고 날짜만 바꿔요. 홈의 D-day 알약을 길게 눌러도 다음 날로 넘어가요.
        </Txt>
        <View style={styles.chips}>
          {DAYS.map((d) => {
            const on = j.phase === d.phase;
            return (
              <Pressable
                key={d.phase}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => {
                  setDay(d.phase);
                  router.dismissTo('/');
                }}
                style={[styles.chip, on && styles.chipOn]}>
                <Txt t="body/small-bold" c={on ? 'text/primary' : 'text/basic'}>
                  {d.label}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <Txt t="body/small-bold" c="text/subtle">
        장면 바로가기 (미리 만든 데이터로 바뀌어요)
      </Txt>
      <Card pad={4} style={{ gap: gap[1] }}>
        {(Object.keys(SCENARIOS) as ScenarioKey[]).map((k) => (
          <ListRow
            key={k}
            title={SCENARIOS[k].label}
            onPress={() => {
              load(k);
              router.dismissTo('/');
            }}
          />
        ))}
      </Card>
      <Card style={{ gap: gap[6] }}>
        <Txt t="heading/xsmall" c="text/bolder">
          현장 상황
        </Txt>
        <Choice label="카메라 잠금" k="securityResult" options={[['locked', '성공'], ['unknown', '실패']]} />
        <Choice label="입소 태그" k="tag" options={[['ok', '인식 성공'], ['fail', '인식 실패'], ['unsupported', 'NFC 미지원'], ['network', '통신 오류']]} />
        <Choice label="사전 준비 제출" k="submitFail" options={[[false, '성공'], [true, '한 번 실패']]} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: gap[3] },
  chip: { paddingHorizontal: padding[6], height: 40, justifyContent: 'center', borderRadius: radius.medium3, borderWidth: 1, borderColor: C['border/gray-light'], backgroundColor: C['surface/white'] },
  chipOn: { borderColor: C['border/primary'], backgroundColor: C['surface/primary-subtler'] },
});
