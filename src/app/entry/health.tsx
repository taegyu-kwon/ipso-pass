import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { api } from '@/api';
import { Answer, useJourney } from '@/state/journey';
import { C, gap, radius } from '@/theme/krds';
import { BackBar, Screen, StepHead } from '@/ui/layout';
import { Badge, Button, Card, Icon, Notice, StatusCircle, Txt } from '@/ui/primitives';

// 현장 입장 1단계 · 건강 문진. 입소 시작을 누르면 먼저 뜬다.
// 제출하면 입소 인증으로, '예'로 답한 문항이 있으면 담당자 확인 안내를 먼저 보여 준다.
export default function Health() {
  const { j, setPrep } = useJourney();
  const qs = api.healthQuestions();
  const answers = j.prep.answers;
  const [tried, setTried] = useState(false);
  const missing = qs.filter((q) => !answers[q.id]);
  const flagged = qs.filter((q) => q.flagIfYes && answers[q.id] === 'yes');

  const set = (id: string, a: Answer) => setPrep({ answers: { ...answers, [id]: a } });

  if (j.prep.healthSubmitted) {
    const needsCheck = j.prep.healthCheck === 'needs_check';
    return (
      <Screen bar={<BackBar title="현장 입장" />} footer={<Button label="다음" onPress={() => router.replace('/entry/tag')} />}>
        <StepHead label="현장 입장 · 건강 문진" index={1} total={api.hasEquipment() ? 5 : 4} title={needsCheck ? '담당자 확인이\n필요한 답변이 있어요' : '건강 문진을\n제출했어요'} />
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: gap[4] }}>
          <StatusCircle icon={needsCheck ? 'warning-fill' : 'success-fill'} color={needsCheck ? 'element/warning' : 'icon/success'} bg={needsCheck ? 'surface/warning-subtler' : 'surface/success-subtler'} size={48} />
          <View style={{ flex: 1, gap: gap[1] }}>
            <Txt t="body/medium-bold">건강 문진 제출됨</Txt>
            <Txt t="body/small" c="text/subtle">
              {needsCheck ? `“${flagged[0]?.text.replace('습니까?', '음')}” 문항에 ‘예’라고 답했어요` : '추가 확인 없음'}
            </Txt>
          </View>
          {needsCheck ? <Badge label="확인 필요" tone="warning" /> : null}
        </Card>
        {needsCheck ? <Notice tone="warning" title="담당자가 직접 확인해요" body="입소 인증 때 담당자에게 말씀해 주세요. 입소 절차는 계속할 수 있어요." /> : null}
      </Screen>
    );
  }

  return (
    <Screen
      bar={<BackBar title="현장 입장" />}
      footer={
        <Button
          label="건강 문진 제출"
          onPress={() => {
            setTried(true);
            if (missing.length) return;
            setPrep({ healthSubmitted: true, healthCheck: flagged.length ? 'needs_check' : 'clear' });
            if (!flagged.length) router.replace('/entry/tag');
          }}
        />
      }>
      <StepHead label="현장 입장 · 건강 문진" index={1} total={api.hasEquipment() ? 5 : 4} title={'건강 상태를\n알려 주세요'} />
      <View style={styles.saved}>
        <Icon name="reset" size={16} color="icon/gray-light" />
        <Txt t="body/xsmall" c="text/subtle">
          답할 때마다 임시 저장돼요
        </Txt>
      </View>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt t="body/medium-bold">건강 문진</Txt>
          <Txt t="body/medium-bold" c="text/primary">
            {qs.length - missing.length} / {qs.length}
          </Txt>
        </View>
        {qs.map((q, i) => {
          const a = answers[q.id];
          const miss = tried && !a;
          return (
            <View key={q.id} style={{ gap: gap[3] }}>
              <Txt t="body/medium-bold" c={miss ? 'text/danger' : 'text/basic'}>
                {i + 1}. {q.text}
              </Txt>
              <View style={{ flexDirection: 'row', gap: gap[3] }}>
                {(['yes', 'no'] as const).map((v) => (
                  <Pressable
                    key={v}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: a === v }}
                    onPress={() => set(q.id, v)}
                    style={[styles.choice, a === v && styles.choiceOn, miss && { borderColor: C['border/danger'] }]}>
                    <Txt t="body/medium-bold" c={a === v ? 'text/primary' : 'text/basic'}>
                      {v === 'yes' ? '예' : '아니요'}
                    </Txt>
                  </Pressable>
                ))}
              </View>
              {miss ? (
                <Txt t="body/xsmall" c="text/danger">
                  답하지 않은 문항이에요
                </Txt>
              ) : null}
            </View>
          );
        })}
      </Card>
      {tried && missing.length ? <Notice tone="warning" title={`답하지 않은 문항이 ${missing.length}개 있어요`} body="빨간색으로 표시한 문항에 답하면 제출할 수 있어요." /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  saved: { flexDirection: 'row', alignItems: 'center', gap: gap[2], marginTop: -gap[3] },
  choice: {
    flex: 1,
    height: 48,
    borderRadius: radius.medium3,
    borderWidth: 1,
    borderColor: C['border/gray-dark'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C['surface/white'],
  },
  choiceOn: { borderColor: C['border/primary'], backgroundColor: C['surface/primary-subtler'], borderWidth: 2 },
});

