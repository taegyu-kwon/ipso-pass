import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { api } from '@/api';
import { useJourney } from '@/state/journey';
import { gap } from '@/theme/krds';
import { Screen } from '@/ui/layout';
import { SuccessHero } from '@/ui/flow';
import { Button, Card, Icon, Notice, Txt } from '@/ui/primitives';


// E7 입소 절차 완료 (완료 단계 3개를 구분해서 보여 준다)
export default function Complete() {
  const { update } = useJourney();
  const MILESTONES = [
    { title: '사전 준비 완료', desc: '11.11 제출 · 기본 정보·계좌·동의' },
    { title: '현장 입장 확인 완료', desc: '08:42 · 건강 문진 · 입소 태그 · 카메라 잠금' },
    { title: '입소 절차 완료', desc: api.hasEquipment() ? `09:05 · 총기 수령 · 장비 ${api.equipment().length}개 (NFC 태그)` : '09:05 · 총기 수령 (NFC 태그)' },
  ];
  return (
    <Screen
      bg="background/white"
      footer={
        <Button
          label="훈련 중 홈으로"
          onPress={() => {
            update((x) => ({ ...x, phase: 'training', completedAt: '09:05' }));
            router.dismissTo('/');
          }}
        />
      }>
      <View style={{ height: gap[6] }} />
      <SuccessHero title="입소 절차를 마쳤어요" sub="오늘 훈련도 안전하게 마치세요." />
      <Card style={{ gap: gap[5] }}>
        {MILESTONES.map((m) => (
          <View key={m.title} style={styles.row}>
            <Icon name="success-fill" size={20} color="icon/success" />
            <View style={{ flex: 1, gap: gap[1] }}>
              <Txt t="body/medium-bold">{m.title}</Txt>
              <Txt t="body/small" c="text/subtle">
                {m.desc}
              </Txt>
            </View>
          </View>
        ))}
      </Card>
      <Notice title="퇴소할 때 다시 이 앱을 열어 주세요" body="반납과 보안 해제를 순서대로 안내해 드려요." />
    </Screen>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'flex-start', gap: gap[4] } });
