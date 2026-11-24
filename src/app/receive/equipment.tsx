import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { api } from '@/api';
import { report } from '@/lib/board';
import { haptic } from '@/lib/haptics';
import { useJourney } from '@/state/journey';
import { C, gap, padding, radius } from '@/theme/krds';
import { BackBar, Screen, StepHead } from '@/ui/layout';
import { EquipmentList } from '@/ui/flow';
import { Button, Icon, Txt } from '@/ui/primitives';

// E5 장비 수령 (수령 전 → 수령 중 → 수령 완료 · 비용 청구 동의)
// 지급대마다 태그 1개. 지급 병사 손목 스트랩의 태그를 병사가 예비군 휴대폰에 찍어 준다.
export default function Equipment() {
  const { j, update } = useJourney();
  const total = api.equipment().length;
  const done = j.receive.equipment;
  const [agree, setAgree] = useState(false);
  const all = done >= total;

  const tag = () => {
    haptic.success();
    const item = api.equipment()[done];
    if (item) report('item', item.name);
    update((x) => ({ ...x, receive: { ...x.receive, equipment: Math.min(total, x.receive.equipment + 1) } }));
  };

  // 시연: 대기 중이면 2초 뒤 자동으로 태그된다 (원을 눌러도 된다)
  useEffect(() => {
    if (all) return;
    const t = setTimeout(tag, 2200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, all]);

  return (
    <Screen
      bar={<BackBar title="현장 입장" />}
      footer={all ? <Button label="동의하고 다음" disabled={!agree} onPress={() => {
            report('equipment');
            router.replace('/entry/complete');
          }} /> : undefined}>
      <StepHead label="현장 입장 · 장비 수령" index={5} total={5} title={all ? '지급 장비를\n모두 받았어요' : '지급 장비를\n순서대로 받아 주세요'} />
      <EquipmentList done={done} verb="수령" onTag={tag} />
      {all ? (
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agree }} onPress={() => setAgree(!agree)} style={styles.agree}>
          <View style={[styles.check, agree && styles.checkOn]}>{agree ? <Icon name="check" size={16} color="icon/inverse" /> : null}</View>
          <View style={{ flex: 1, gap: gap[1] }}>
            <Txt t="body/small-bold">분실·미반납 시 비용 청구에 동의합니다</Txt>
            <Txt t="body/xsmall" c="text/subtle">
              퇴소할 때 반납하지 않은 장비는 본인에게 비용이 청구돼요.
            </Txt>
          </View>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  agree: { flexDirection: 'row', gap: gap[4], padding: padding[6], borderRadius: radius.xlarge, backgroundColor: C['surface/gray-subtle'] },
  check: { width: 24, height: 24, borderRadius: radius.small, borderWidth: 1.5, borderColor: C['border/gray-dark'], alignItems: 'center', justifyContent: 'center', backgroundColor: C['surface/white'] },
  checkOn: { backgroundColor: C['element/primary'], borderColor: C['element/primary'] },
});
