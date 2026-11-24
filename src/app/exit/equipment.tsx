import { router } from 'expo-router';
import { useEffect } from 'react';

import { api } from '@/api';
import { haptic } from '@/lib/haptics';
import { useJourney } from '@/state/journey';
import { BackBar, Screen, StepHead } from '@/ui/layout';
import { EquipmentList } from '@/ui/flow';
import { Button } from '@/ui/primitives';

// X3 물자 반납 (반납 전 → 반납 중 → 반납 완료). 지급대마다 태그 1개.
export default function ExitEquipment() {
  const { j, update } = useJourney();
  const total = api.equipment().length;
  const done = j.exit.equipment;
  const all = done >= total;

  const tag = () => {
    haptic.success();
    update((x) => ({ ...x, exit: { ...x.exit, equipment: Math.min(total, x.exit.equipment + 1) } }));
  };
  useEffect(() => {
    if (all) return;
    const t = setTimeout(tag, 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, all]);

  return (
    <Screen bar={<BackBar title="퇴소 절차" />} footer={all ? <Button label="다음" onPress={() => router.replace('/exit/security')} /> : undefined}>
      <StepHead label="퇴소 절차 · 물자 반납" index={2} total={3} title={all ? '지급 장비를\n모두 반납했어요' : '지급 장비를\n순서대로 반납해 주세요'} />
      <EquipmentList done={done} verb="반납" onTag={tag} />
    </Screen>
  );
}
