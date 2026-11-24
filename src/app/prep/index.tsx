import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api } from '@/api';
import { prepCount, useJourney } from '@/state/journey';
import { prepItems } from '@/state/prep';
import { gap } from '@/theme/krds';
import { BackBar, Screen } from '@/ui/layout';
import { Button, Card, ListRow, ProgressBar, Txt } from '@/ui/primitives';
import { Toast } from '@/ui/sheet';

// P0 사전 준비 허브
export default function PrepHub() {
  const { j } = useJourney();
  const items = prepItems(j.prep);
  const n = prepCount(j.prep);
  const next = items.find((i) => !i.done);
  const [toast, setToast] = useState(n > 0 && n < 4);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);
  const t = api.training();

  return (
    <Screen
      bar={<BackBar title="사전 준비" />}
      footer={
        next ? (
          <Button label={n === 0 ? '준비 시작하기' : `이어서 준비하기 (${next.title.replace(' 확인', '')})`} onPress={() => router.push(next.route)} />
        ) : j.phase === 'today' ? (
          <Button label="입소 시작" onPress={() => router.replace('/entry/health')} />
        ) : (
          <Button label="홈으로" onPress={() => router.dismissTo('/')} />
        )
      }
      overlay={toast ? <Toast text="임시 저장했어요 · 이어서 작성할 수 있어요" bottom={128} /> : null}>
      <Card style={{ gap: gap[3] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt t="heading/xsmall" c="text/bolder">
            사전 준비
          </Txt>
          <Txt t="heading/xsmall" c="text/primary">
            {n} / 4
          </Txt>
        </View>
        <ProgressBar value={n} total={4} />
        <Txt t="body/small" c="text/subtle">
          입소 마감 {t.dateLabel} {t.deadline} · 집에서 미리 마치면 현장에서는 확인만 해요
        </Txt>
      </Card>
      <Card pad={4} style={{ gap: gap[1] }}>
        {items.map((i) => (
          <ListRow key={i.key} title={i.title} desc={i.desc} badge={i.badge} onPress={() => router.push(i.route)} />
        ))}
      </Card>
    </Screen>
  );
}
