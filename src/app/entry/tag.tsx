import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { api } from '@/api';
import { report } from '@/lib/board';
import { haptic } from '@/lib/haptics';
import { useJourney } from '@/state/journey';
import { BackBar, Screen, StepHead } from '@/ui/layout';
import { Badge, Button } from '@/ui/primitives';
import { Sheet } from '@/ui/sheet';

type S = 'scan' | 'fail' | 'unsupported' | 'network' | 'staff' | 'done' | 'staffDone';

// E3 입소 인증(신원 확인): 현장 입장의 첫 단계. 태그하면 전산에 바로 기록되고 같은 팝업이 E4-1 완료로 바뀐다.
// 다음은 카메라 잠금 확인 → 총기 지급 → 장비 수령
// 실패: E3-1 인식 실패 · E3-2 NFC 미지원 · E3-3 통신 오류 → E4-2 담당자 확인 요청 (태그를 못 쓸 때만)
export default function Tag() {
  const { j, update } = useJourney();
  const [s, setS] = useState<S>('scan');

  // 태그 대기: 원을 누르거나 2.5초가 지나면 시연 설정에 따라 결과가 나온다
  const read = () => {
    const r = j.sim.tag;
    if (r === 'ok') {
      haptic.success();
      report('entry');
      update((x) => ({ ...x, entry: { entered: true, enteredAt: '08:42' } }));
      setS('done');
    } else setS(r === 'fail' ? 'fail' : r);
  };
  useEffect(() => {
    if (s !== 'scan') return;
    const t = setTimeout(read, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  // 태그를 못 쓸 때의 담당자 확인은 담당자 단말에서 이뤄진다. 시연에서는 잠시 뒤 확인된 것으로 넘긴다.
  useEffect(() => {
    if (s !== 'staff') return;
    const t = setTimeout(() => {
      update((x) => ({ ...x, entry: { entered: true, enteredAt: '08:42' } }));
      haptic.success();
      report('entry');
      setS('staffDone');
    }, 3000);
    return () => clearTimeout(t);
  }, [s, update]);

  const retry = () => {
    update((x) => ({ ...x, sim: { ...x.sim, tag: 'ok' } })); // 시연: 다시 시도하면 성공
    setS('scan');
  };

  const sheet = {
    scan: (
      <Sheet icon="nfc" pulse title="태그를 찾고 있어요" desc="입소 태그에 가까이 대 주세요." onIconPress={read}>
        <Button kind="tertiary" label="취소" onPress={() => router.back()} />
      </Sheet>
    ),
    fail: (
      <Sheet icon="error-fill" iconColor="icon/danger" iconBg="surface/danger-subtler" title="태그를 인식하지 못했어요" desc="휴대폰을 태그에 다시 가까이 대 주세요.">
        <Button label="다시 시도" onPress={retry} />
        <Button kind="tertiary" label="담당자 확인 요청" onPress={() => setS('staff')} />
      </Sheet>
    ),
    unsupported: (
      <Sheet icon="information-fill" iconColor="icon/information" iconBg="surface/information-subtler" title="이 휴대폰은 NFC를 쓸 수 없어요" desc="입소패스 화면을 담당자에게 보여 주세요. 담당자가 사진과 이름으로 신원을 확인해요.">
        <Button label="입소패스 보여주기" onPress={() => setS('staff')} />
        <Button kind="text" label="닫기" onPress={() => router.back()} />
      </Sheet>
    ),
    network: (
      <Sheet icon="warning-fill" iconColor="element/warning" iconBg="surface/warning-subtler" title="연결이 불안정해요" desc="인증 기록이 전송되지 않았어요. 다시 시도하거나 담당자 확인을 요청해 주세요.">
        <Button label="다시 시도" onPress={retry} />
        <Button kind="tertiary" label="담당자 확인 요청" onPress={() => setS('staff')} />
      </Sheet>
    ),
    staff: (
      <Sheet icon="nfc" title="담당자에게 확인을 요청했어요" desc="입소패스를 담당자에게 보여 주세요. 담당자가 사진과 이름으로 신원을 확인해요." extra={<Badge label="담당자 확인 대기" tone="information" />}>
        <Button kind="tertiary" label="입소패스 보여주기" onPress={() => router.push('/pass')} />
      </Sheet>
    ),
    done: (
      <Sheet icon="success-fill" iconColor="icon/success" iconBg="surface/success-subtler" title="신원 확인이 끝났어요" desc="입소 태그 08:42">
        <Button label="다음" onPress={() => router.replace('/entry/security')} />
      </Sheet>
    ),
    staffDone: (
      <Sheet icon="success-fill" iconColor="icon/success" iconBg="surface/success-subtler" title="신원 확인이 끝났어요" desc="담당자 확인 08:42">
        <Button label="다음" onPress={() => router.replace('/entry/security')} />
      </Sheet>
    ),
  }[s];

  return (
    <Screen bar={<BackBar title="현장 입장" />} overlay={sheet}>
      <StepHead label="현장 입장 · 입소 인증 (신원 확인)" index={2} total={api.hasEquipment() ? 5 : 4} title={'입소 태그에\n휴대폰을 대 주세요'} />
    </Screen>
  );
}
