import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api } from '@/api';
import { haptic } from '@/lib/haptics';
import { IconName } from '@/theme/icons';
import { gap } from '@/theme/krds';
import { BackBar, Screen } from '@/ui/layout';
import { Button, Card, ListRow, Txt } from '@/ui/primitives';
import { Sheet } from '@/ui/sheet';

type Spot = { id: string; label: string; icon: IconName };

// 예비군이 휴대폰을 대는 태그 자리: 입소 인증 · 총기 · 장비 물자
const SPOTS: Spot[] = [
  { id: 'entry', label: '입소 인증', icon: 'id-card' },
  { id: 'firearm', label: '총기', icon: 'shield' },
  ...api.equipment().map((e) => ({ id: e.id, label: e.name, icon: 'equipment' as IconName })),
];

// 담당자 · 태그 등록. 새 NFC 태그를 어느 자리에 붙였는지 앱에 알려 준다.
export default function AdminTag() {
  const [done, setDone] = useState<string[]>([]);
  const [spot, setSpot] = useState<Spot | null>(null);
  const [s, setS] = useState<'scan' | 'done'>('scan');

  // 태그 대기: 원을 누르거나 2.5초가 지나면 태그한 것으로 본다 (시연)
  const read = () => {
    if (!spot) return;
    haptic.success();
    setDone((d) => [...d, spot.id]);
    setS('done');
  };
  useEffect(() => {
    if (!spot || s !== 'scan') return;
    const t = setTimeout(read, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot, s]);

  const close = () => {
    setSpot(null);
    setS('scan');
  };

  const sheet = !spot ? null : s === 'scan' ? (
    <Sheet icon="nfc" pulse title="태그를 찾고 있어요" desc={`${spot.label} 자리의 태그에 휴대폰을 대 주세요.`} onIconPress={read}>
      <Button kind="tertiary" label="취소" onPress={close} />
    </Sheet>
  ) : (
    <Sheet icon="success-fill" title="등록됐어요" desc={`${spot.label} 태그`}>
      <Button label="확인" onPress={close} />
    </Sheet>
  );

  return (
    <Screen bar={<BackBar title="태그 등록" />} overlay={sheet}>
      <View style={{ gap: gap[2] }}>
        <Txt t="heading/large" c="text/bolder" accessibilityRole="header">
          어느 자리의 태그인가요?
        </Txt>
        <Txt t="body/medium" c="text/subtle">
          고른 뒤 휴대폰을 새 태그에 대면 등록돼요.
        </Txt>
      </View>
      <Card pad={4} style={{ gap: gap[1] }}>
        {SPOTS.map((p) => {
          const on = done.includes(p.id);
          return (
            <ListRow
              key={p.id}
              leading={p.icon}
              title={p.label}
              badge={on ? { label: '등록됨', tone: 'success' } : { label: '미등록', tone: 'gray' }}
              onPress={() => {
                haptic.tap();
                setSpot(p);
              }}
            />
          );
        })}
      </Card>
    </Screen>
  );
}
