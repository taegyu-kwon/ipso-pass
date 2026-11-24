import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { api } from '@/api';
import { mask } from '@/lib/mask';
import { useJourney } from '@/state/journey';
import { C, gap, padding, radius } from '@/theme/krds';
import { BackBar, Screen, StepHead } from '@/ui/layout';
import { Button, Card, Icon, KV, Notice, Txt } from '@/ui/primitives';
import { Sheet } from '@/ui/sheet';

const FIELDS = ['주소지', '연락처', '소속 부대'];

// P1 기본 정보 확인 (+ P1-1 정정 요청 시트)
export default function Basic() {
  const { setPrep } = useJourney();
  const r = api.reservist();
  const [sheet, setSheet] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <Screen
      bar={<BackBar title="사전 준비" />}
      footer={
        <Button
          label="맞아요, 다음"
          onPress={() => {
            setPrep({ basic: true });
            router.replace('/prep/account');
          }}
        />
      }
      overlay={
        sheet ? (
          <Sheet title="어떤 정보가 다른가요?" desc="정정 요청은 담당 부대가 확인한 뒤 반영돼요. 그동안 준비는 계속할 수 있어요.">
            {FIELDS.map((f) => (
              <Pressable
                key={f}
                accessibilityRole="radio"
                accessibilityState={{ checked: pick === f }}
                onPress={() => setPick(f)}
                style={{
                  padding: padding[6],
                  borderRadius: radius.large,
                  borderWidth: 1,
                  borderColor: C[pick === f ? 'border/primary' : 'border/gray-light'],
                  backgroundColor: C[pick === f ? 'surface/primary-subtler' : 'surface/white'],
                }}>
                <Txt t="body/medium-bold" c={pick === f ? 'text/primary' : 'text/basic'}>
                  {f}
                </Txt>
              </Pressable>
            ))}
            <Button
              label="정정 요청 보내기"
              disabled={!pick}
              onPress={() => {
                setSheet(false);
                setSent(true);
              }}
            />
            <Button kind="text" label="취소" onPress={() => setSheet(false)} />
          </Sheet>
        ) : null
      }>
      <StepHead label="사전 준비 · 기본 정보" index={1} total={4} title={'등록된 정보가\n맞는지 확인해 주세요'} />
      {sent ? (
        <Notice tone="success" title={`${pick} 정정 요청을 보냈어요`} body="담당 부대가 확인하면 알림으로 알려 드려요." />
      ) : (
        <Notice title="등록 정보를 불러왔어요" body="예비군 등록 정보를 기준으로 보여드려요." />
      )}
      <Card style={{ gap: gap[3] }}>
        <KV k="이름" v={r.name} />
        <KV k="생년월일" v={r.birth} />
        <KV k="연차" v={r.yearLabel} />
        <KV k="소속 부대" v={r.unit} />
        <KV k="주소지" v={r.address} />
        <KV k="연락처" v={mask(r.phone)} />
      </Card>
      <Pressable accessibilityRole="button" onPress={() => setSheet(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: gap[1] }}>
        <Txt t="body/small-bold" c="text/primary">
          정보가 다른가요? 정정 요청하기
        </Txt>
        <Icon name="chevron-right" size={16} color="icon/primary" />
      </Pressable>
      <View />
    </Screen>
  );
}
