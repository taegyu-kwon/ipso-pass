import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { api } from '@/api';
import { report } from '@/lib/board';
import { haptic } from '@/lib/haptics';
import { useJourney } from '@/state/journey';
import { BackBar, Screen, StepHead } from '@/ui/layout';
import { PassCard, PassFace, TrainingInfo } from '@/ui/pass';
import { Button, Notice } from '@/ui/primitives';
import { Sheet } from '@/ui/sheet';

// E6a 총기 지급: 담당자가 입소패스를 눈으로 확인하고 총기를 건넨다.
// E6b 수령 기록: 예비군이 지급대 NFC 태그를 찍으면 기록된다. 태그는 같은 화면 아래 팝업에서.
export default function Firearm() {
  const { j, update } = useJourney();
  const { staff } = useLocalSearchParams<{ staff?: string }>();
  const recorded = j.receive.firearm === 'done';
  const [scan, setScan] = useState(false);
  const tag = () => {
    haptic.success();
    report('firearm');
    update((x) => ({ ...x, receive: { ...x.receive, firearm: 'done' } }));
  };

  // 시연: 팝업이 뜨고 2초 뒤 자동으로 태그된다 (원을 눌러도 된다)
  useEffect(() => {
    if (!scan || recorded) return;
    const t = setTimeout(tag, 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan, recorded]);

  const sheet = recorded ? (
    <Sheet icon="success-fill" iconColor="icon/success" iconBg="surface/success-subtler" title="총기 수령이 기록됐어요" desc={`09:05 · ${api.firearm().weapon} · NFC 태그`}>
      {api.hasEquipment() ? (
        <Button label="장비 수령으로" onPress={() => router.replace('/receive/equipment')} />
      ) : (
        <Button label="다음" onPress={() => router.replace('/entry/complete')} />
      )}
    </Sheet>
  ) : scan ? (
    <Sheet icon="nfc" pulse title="지급대 태그에 휴대폰을 대 주세요" desc="태그하면 총기 수령이 바로 기록돼요." onIconPress={tag}>
      <Button kind="tertiary" label="취소" onPress={() => setScan(false)} />
    </Sheet>
  ) : null;

  return (
    <Screen
      bg="background/white"
      bar={<BackBar title="현장 입장" />}
      overlay={sheet}
      footer={<Button label="총기를 받았어요" onPress={() => setScan(true)} />}>
      <StepHead label="현장 입장 · 총기 지급" index={4} total={api.hasEquipment() ? 5 : 4} title={'담당자에게\n입소패스를 보여 주세요'} />
      {staff === 'security' ? <Notice title="카메라 상태 확인을 담당자에게 요청했어요" body="총기를 받을 때 담당자가 함께 확인해요." /> : null}
      <PassCard pill="총기 지급" live>
        <PassFace big badge={{ label: '현장 입장 확인 완료', tone: 'success' }} />
        <TrainingInfo />
      </PassCard>
    </Screen>
  );
}
