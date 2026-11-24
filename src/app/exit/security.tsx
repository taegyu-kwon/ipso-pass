import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { api } from '@/api';
import { useJourney } from '@/state/journey';
import { BackBar, Screen, StepHead } from '@/ui/layout';
import { StatusBox } from '@/ui/flow';
import { Button } from '@/ui/primitives';

// X4 카메라 잠금 해제. 입소 때 이 앱이 잠근 카메라를 이 앱이 직접 푼다.
export default function ExitSecurity() {
  const { update } = useJourney();
  const [s, setS] = useState<'locked' | 'checking' | 'unlocked'>('locked');

  useEffect(() => {
    if (s !== 'checking') return;
    const t = setTimeout(() => {
      setS('unlocked');
      update((x) => ({ ...x, exit: { ...x.exit, unlocked: true } }));
    }, 1600);
    return () => clearTimeout(t);
  }, [s, update]);

  return (
    <Screen
      bar={<BackBar title="퇴소 절차" />}
      footer={
        s === 'unlocked' ? (
          <Button label="퇴소 완료" onPress={() => router.replace('/exit/done')} />
        ) : (
          <Button label={s === 'checking' ? '푸는 중' : '카메라 잠금 풀기'} disabled={s === 'checking'} onPress={() => setS('checking')} />
        )
      }>
      <StepHead label="퇴소 절차 · 보안 해제" index={api.hasEquipment() ? 3 : 2} total={api.hasEquipment() ? 3 : 2} title={'카메라 잠금을\n해제해 주세요'} />
      {s === 'unlocked' ? (
        <StatusBox icon="success-fill" color="icon/success" title="카메라 잠금을 풀었어요" motion="done" desc="16:40 해제" />
      ) : s === 'checking' ? (
        <StatusBox icon="reset" color="icon/primary" title="카메라 잠금을 풀고 있어요" motion="busy" />
      ) : (
        <StatusBox icon="shield" color="icon/primary" title="카메라 잠금 중" motion="wait" />
      )}
    </Screen>
  );
}
