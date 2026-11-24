import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { api } from '@/api';
import { report } from '@/lib/board';
import { haptic } from '@/lib/haptics';
import { mask } from '@/lib/mask';
import { prepCount, useJourney } from '@/state/journey';
import { C, gap } from '@/theme/krds';
import { BackBar, Screen, StepHead } from '@/ui/layout';
import { Button, Card, Notice, Txt } from '@/ui/primitives';
import { CheckBurst, Sheet } from '@/ui/sheet';

// P4 제출 전 확인 (+ P4-1 제출 중 · P4-2 제출 실패 · P4-3 제출 완료 시트)
export default function Review() {
  const { j, setPrep, update } = useJourney();
  const p = j.prep;
  const [sheet, setSheet] = useState<'sending' | 'fail' | 'done' | null>(null);
  const ready = prepCount(p) >= 3;
  const today = j.phase === 'today';

  const submit = async () => {
    setSheet('sending');
    const res = await api.submitPrep({ failOnce: j.sim.submitFail });
    if (!res.ok) {
      update((s) => ({ ...s, sim: { ...s.sim, submitFail: false } })); // 시연: 한 번만 실패
      return setSheet('fail');
    }
    setPrep({ submitted: true });
    haptic.success();
    report('prep');
    setSheet('done');
  };

  const rows = [
    { title: '기본 정보', desc: p.basic ? '확인 완료 · 정정 요청 없음' : '아직 확인하지 않았어요', route: '/prep/basic' as const },
    { title: '지급 계좌', desc: p.account ? `${api.savedAccount().bank} ${mask(api.savedAccount().number)}` : '아직 입력하지 않았어요', route: '/prep/account' as const },
    { title: '동의·서명', desc: p.signed ? '필수 2 · 선택 1 · 서명 완료' : '아직 서명하지 않았어요', route: '/prep/consent' as const },
  ];

  return (
    <Screen
      bar={<BackBar title="사전 준비" />}
      footer={<Button label="최종 제출" disabled={!ready} onPress={submit} />}
      overlay={
        sheet === 'fail' ? (
          <Sheet icon="warning-fill" iconColor="element/warning" iconBg="surface/warning-subtler" title="제출하지 못했어요" desc="연결이 불안정해요. 작성한 내용은 그대로 저장돼 있어요.">
            <Button label="다시 시도" onPress={submit} />
            <Button kind="tertiary" label="나중에 하기" onPress={() => router.dismissTo('/')} />
          </Sheet>
        ) : sheet === 'sending' || sheet === 'done' ? (
          // 제출 중 → 완료는 같은 시트에서 내용만 바뀐다 (크기 그대로, 다시 올라오지 않게)
          <Sheet
            art={
              sheet === 'done' ? (
                <CheckBurst />
              ) : (
                <View style={styles.spinner}>
                  <ActivityIndicator size="large" color={C['element/primary']} />
                </View>
              )
            }
            title={sheet === 'done' ? '사전 준비를 마쳤어요' : '제출하고 있어요'}
            desc={
              sheet === 'sending'
                ? '잠시만 기다려 주세요.'
                : today
                  ? '이어서 입소 절차를 시작해요.'
                  : '입소 당일 홈에서 입소 시작을 누르면 돼요.'
            }>
            {/* 제출 중에도 버튼 자리를 비워 둬 시트 높이가 같다 */}
            <View style={sheet === 'sending' && styles.hidden} pointerEvents={sheet === 'sending' ? 'none' : 'auto'} importantForAccessibility={sheet === 'sending' ? 'no-hide-descendants' : 'auto'} accessibilityElementsHidden={sheet === 'sending'}>
              {/* 훈련 당일이면 바로 입소 절차(입소 인증)로 */}
              {today ? <Button label="입소 시작" onPress={() => router.replace('/entry/health')} /> : <Button label="홈으로" onPress={() => router.dismissTo('/')} />}
            </View>
          </Sheet>
        ) : null
      }>
      <StepHead label="사전 준비 · 제출 전 확인" index={4} total={4} title={'제출 전에\n한 번 더 확인해 주세요'} />
      {!ready ? <Notice tone="warning" title="마치지 않은 항목이 있어요" body="모든 항목을 마치면 제출할 수 있어요." /> : null}
      {rows.map((r) => (
        <Card key={r.title} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: gap[1] }}>
            <Txt t="body/medium-bold">{r.title}</Txt>
            <Txt t="body/small" c="text/subtle">
              {r.desc}
            </Txt>
          </View>
          <Txt t="body/small-bold" c="text/primary" accessibilityRole="button" onPress={() => router.push(r.route)}>
            수정
          </Txt>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  spinner: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  hidden: { opacity: 0 },
});
