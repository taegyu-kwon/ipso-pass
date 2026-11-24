import { router } from 'expo-router';

import { api } from '@/api';
import { passState, useJourney } from '@/state/journey';
import { BackBar, Screen } from '@/ui/layout';
import { PassCard, PassFace, TrainingInfo } from '@/ui/pass';
import { Button, Notice } from '@/ui/primitives';

// P5a~e 입소패스 (상태별)
export default function Pass() {
  const { j } = useJourney();
  const s = passState(j);
  const t = api.training();

  const notice = {
    ready: <Notice title="훈련 당일부터 사용할 수 있어요" body="당일 이 화면에서 바로 현장 입장을 시작해요." />,
    today: null,
    needs_check: <Notice tone="warning" title="담당자 확인이 필요해요" body="건강 문진 답변 1건을 입장할 때 담당자가 확인해요." />,
    incomplete: <Notice tone="warning" title="마치지 않은 준비가 있어요" body="입장할 때 담당자가 남은 항목을 확인해요." />,
    unusable: <Notice tone="danger" title="이 패스는 사용할 수 없어요" body={`훈련 일정이 ${t.dateLabel}로 바뀌었어요. 새 일정으로 다시 준비해 주세요.`} />,
    used: <Notice title="이미 처리된 패스예요" body={`${t.dateLabel} ${j.entry.enteredAt ?? ''} 현장 입장이 확인됐어요. 다시 사용할 수 없어요.`} />,
  }[s];

  const badge = {
    ready: { label: '사전 준비 완료', tone: 'success' as const },
    today: { label: '사용 가능', tone: 'primary' as const },
    needs_check: { label: '현장 확인 필요', tone: 'warning' as const },
    incomplete: { label: '준비 미완료', tone: 'warning' as const },
    unusable: { label: '일정 변경됨', tone: 'danger' as const },
    used: { label: '입장 확인 완료', tone: 'gray' as const },
  }[s];

  const pill = s === 'ready' ? '입소 D-1' : s === 'unusable' ? '사용 불가' : s === 'used' ? '처리 완료' : '오늘';
  const dim = s === 'unusable' || s === 'used';

  const footer =
    s === 'today' || s === 'needs_check' || s === 'incomplete' ? (
      <Button label="입소 시작" onPress={() => router.push('/entry/health')} />
    ) : s === 'unusable' ? (
      <Button label="새 일정으로 준비하기" onPress={() => router.replace('/prep')} />
    ) : s === 'used' ? (
      <Button label="훈련 중 홈으로" onPress={() => router.dismissTo('/')} />
    ) : undefined;

  return (
    <Screen bg="background/white" bar={<BackBar title="입소패스" />} footer={footer}>
      {notice}
      <PassCard pill={pill} dark={dim} live>
        <PassFace big badge={badge} />
        <TrainingInfo />
      </PassCard>
    </Screen>
  );
}
