import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { api } from '@/api';
import { report } from '@/lib/board';
import { haptic } from '@/lib/haptics';
import { useJourney } from '@/state/journey';
import { BackBar, Screen, StepHead } from '@/ui/layout';
import { StatusBox } from '@/ui/flow';
import { Button, Notice } from '@/ui/primitives';

type S = 'ready' | 'locking' | 'locked' | 'fail';

// 카메라 잠금. 별도 보안 앱 없이 이 앱이 직접 잠근다. 입소 인증 다음, 총기 지급 전 단계.
// 실제 구현: Android는 기기 관리자 권한(DevicePolicyManager.setCameraDisabled), iOS는 MDM 프로파일로 잠근다 (보안성 검증 필요).
// 시연에서는 결과가 시연 패널 설정(잠금 성공 / 실패)을 따른다.
export default function Security() {
  const { j } = useJourney();
  const [s, setS] = useState<S>('ready');

  useEffect(() => {
    if (s !== 'locking') return;
    const t = setTimeout(() => {
      const ok = j.sim.securityResult === 'locked';
      if (ok) {
        haptic.success();
        report('security');
      }
      setS(ok ? 'locked' : 'fail');
    }, 1600);
    return () => clearTimeout(t);
  }, [s, j.sim.securityResult]);

  // 잠그지 못하면 담당자 확인을 요청하고 다음 단계로 (총기 지급 때 담당자가 함께 확인)
  const next = (staff?: boolean) => router.replace(staff ? '/receive/firearm?staff=security' : '/receive/firearm');

  const box = {
    ready: <StatusBox icon="shield" color="icon/primary" title="카메라가 켜져 있어요" motion="wait" desc="훈련장 안에서는 카메라를 쓸 수 없어요" />,
    locking: <StatusBox icon="reset" color="icon/primary" title="카메라를 잠그고 있어요" motion="busy" />,
    locked: <StatusBox icon="success-fill" color="icon/success" title="카메라를 잠갔어요" motion="done" desc="08:31 잠금" />,
    fail: <StatusBox icon="warning-fill" color="element/warning" title="카메라를 잠그지 못했어요" />,
  }[s];

  const footer = {
    ready: <Button label="카메라 잠그기" icon="shield" onPress={() => setS('locking')} />,
    locking: <Button label="잠그는 중" disabled />,
    locked: <Button label="다음" onPress={() => next()} />,
    fail: (
      <>
        <Button label="다시 시도" onPress={() => setS('locking')} />
        <Button kind="tertiary" label="담당자 확인 요청" onPress={() => next(true)} />
      </>
    ),
  }[s];

  return (
    <Screen bar={<BackBar title="현장 입장" />} footer={footer}>
      <StepHead label="현장 입장 · 카메라 잠금" index={3} total={api.hasEquipment() ? 5 : 4} title={'카메라를\n잠가 주세요'} />
      {box}
      {s === 'fail' ? <Notice tone="warning" title="담당자에게 확인을 요청해 주세요" body="총기를 받을 때 담당자가 카메라 상태를 함께 확인해요." /> : null}
    </Screen>
  );
}
