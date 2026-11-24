import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { api } from '@/api';
import { haptic } from '@/lib/haptics';
import { useJourney } from '@/state/journey';
import { BackBar, Screen, StepHead } from '@/ui/layout';
import { PassCard, PassFace, TrainingInfo } from '@/ui/pass';
import { Button } from '@/ui/primitives';
import { Sheet } from '@/ui/sheet';

// X1 총기 반납: 담당자가 입소패스를 눈으로 확인하고 총기를 받는다.
// X2 반납 기록: 예비군이 반납대 NFC 태그를 찍으면 기록된다. 태그는 같은 화면 아래 팝업에서.
export default function ExitFirearm() {
  const { j, update } = useJourney();
  const done = j.exit.firearm === 'done';
  const [scan, setScan] = useState(false);
  const tag = () => {
    haptic.success();
    update((x) => ({ ...x, exit: { ...x.exit, firearm: 'done' } }));
  };

  // 시연: 팝업이 뜨고 2초 뒤 자동으로 태그된다 (원을 눌러도 된다)
  useEffect(() => {
    if (!scan || done) return;
    const t = setTimeout(tag, 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan, done]);

  const sheet = done ? (
    <Sheet icon="success-fill" iconColor="icon/success" iconBg="surface/success-subtler" title="총기 반납이 기록됐어요" desc={`16:30 · ${api.firearm().weapon} · NFC 태그`}>
      {api.hasEquipment() ? (
        <Button label="물자 반납으로" onPress={() => router.replace('/exit/equipment')} />
      ) : (
        <Button label="다음" onPress={() => router.replace('/exit/security')} />
      )}
    </Sheet>
  ) : scan ? (
    <Sheet icon="nfc" pulse title="반납대 태그에 휴대폰을 대 주세요" desc="태그하면 총기 반납이 바로 기록돼요." onIconPress={tag}>
      <Button kind="tertiary" label="취소" onPress={() => setScan(false)} />
    </Sheet>
  ) : null;

  return (
    <Screen bg="background/white" bar={<BackBar title="퇴소 절차" />} overlay={sheet} footer={<Button label="총기를 반납했어요" onPress={() => setScan(true)} />}>
      <StepHead label="퇴소 절차 · 총기 반납" index={1} total={api.hasEquipment() ? 3 : 2} title={'담당자에게\n입소패스를 보여 주세요'} />
      <PassCard pill="총기 반납" live>
        <PassFace big badge={{ label: '입소 절차 완료', tone: 'success' }} />
        <TrainingInfo />
      </PassCard>
    </Screen>
  );
}
