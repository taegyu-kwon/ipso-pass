import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { api } from '@/api';
import { useJourney } from '@/state/journey';
import { gap } from '@/theme/krds';
import { Screen } from '@/ui/layout';
import { SuccessHero } from '@/ui/flow';
import { Badge, Button, Card, Icon, Notice, Txt } from '@/ui/primitives';

// X5 퇴소 완료. 퇴소 완료 ≠ 이수 완료 (이수 반영은 부대 확인 후)
export default function ExitDone() {
  const { update } = useJourney();
  const r = api.reservist();
  const t = api.training();
  const rows = [
    ['입소 · 퇴소', '08:24 → 16:42'],
    ['총기 반납', 'NFC 태그 확인'],
    ['물자 반납', '5개 모두'],
    ['카메라 잠금', '해제됨'],
  ];
  return (
    <Screen
      bg="background/white"
      footer={
        <Button
          label="홈으로"
          onPress={() => {
            update((x) => ({ ...x, phase: 'finished' }));
            router.dismissTo('/');
          }}
        />
      }>
      <View style={{ height: gap[6] }} />
      <SuccessHero title="퇴소가 완료됐어요" sub={`훈련 수고하셨습니다, ${r.name} 님.`} />
      <Card style={{ gap: gap[4] }}>
        <View style={styles.between}>
          <Txt t="body/small" c="text/subtle">
            {t.siteName}
          </Txt>
          <Badge label="3 / 3 완료" tone="success" />
        </View>
        {rows.map(([k, v]) => (
          <View key={k} style={styles.between}>
            <View style={[styles.between, { gap: gap[3] }]}>
              <Icon name="success-fill" size={20} color="icon/success" />
              <Txt t="body/medium-bold">{k}</Txt>
            </View>
            <Txt t="body/small" c="text/subtle">
              {v}
            </Txt>
          </View>
        ))}
      </Card>
      <Notice title="보상비는 등록한 계좌로 지급돼요" body="이수 반영은 부대 확인 후 알림으로 알려 드려요. 이수 확인서는 내 훈련에서 받을 수 있어요." />
    </Screen>
  );
}

const styles = StyleSheet.create({ between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } });
