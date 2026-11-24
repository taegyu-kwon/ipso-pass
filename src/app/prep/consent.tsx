import { router } from 'expo-router';
import { Dispatch, SetStateAction, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { api } from '@/api';
import { useJourney } from '@/state/journey';
import { C, gap, padding, radius } from '@/theme/krds';
import { BackBar, Screen, StepHead } from '@/ui/layout';
import { Badge, Button, Card, Icon, Txt } from '@/ui/primitives';
import { Sheet } from '@/ui/sheet';

function Check({ on }: { on: boolean }) {
  return (
    <View style={[styles.check, on && styles.checkOn]}>
      {on ? <Icon name="check" size={16} color="icon/inverse" /> : null}
    </View>
  );
}

// 손가락으로 쓰는 서명 칸
function SignaturePad({ paths, onChange }: { paths: string[]; onChange: Dispatch<SetStateAction<string[]>> }) {
  // 손가락 처리기는 한 번만 만든다. 이전 획은 setState 함수형 업데이트로 읽어 ref가 필요 없다
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      // 서명 중에 화면 스크롤이 손가락을 가져가지 않게 한다
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        onChange((p) => [...p, `M${x.toFixed(1)} ${y.toFixed(1)}`]);
      },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        onChange((p) => [...p.slice(0, -1), `${p[p.length - 1]} L${x.toFixed(1)} ${y.toFixed(1)}`]);
      },
    }),
  );
  return (
    <View style={styles.pad} {...pan.panHandlers} accessibilityLabel="서명 칸">
      <Svg width="100%" height="100%">
        {paths.map((d, i) => (
          <Path key={i} d={d} stroke={C['text/bolder']} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </Svg>
      {!paths.length ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Txt t="body/small" c="text/disabled" center style={{ marginTop: 64 }}>
            여기에 이름을 써 주세요
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

// P3 동의·서명 (+ P3-1 약관 상세 시트)
export default function Consent() {
  const { j, setPrep } = useJourney();
  const items = api.consents();
  const [agreed, setAgreed] = useState<string[]>(j.prep.consents);
  const [paths, setPaths] = useState<string[]>([]);
  const [detail, setDetail] = useState<string | null>(null);
  const requiredOk = items.filter((i) => i.required).every((i) => agreed.includes(i.id));
  const all = agreed.length === items.length;
  const toggle = (id: string) => setAgreed((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  const open = items.find((i) => i.id === detail);

  return (
    <Screen
      bar={<BackBar title="사전 준비" />}
      footer={
        <Button
          label="다음"
          disabled={!requiredOk || !paths.length}
          onPress={() => {
            setPrep({ consents: agreed, signed: true });
            router.replace('/prep/review');
          }}
        />
      }
      overlay={
        open ? (
          <Sheet title={open.title} desc={open.summary}>
            <Button
              label="동의하고 닫기"
              onPress={() => {
                if (!agreed.includes(open.id)) toggle(open.id);
                setDetail(null);
              }}
            />
            <Button kind="text" label="닫기" onPress={() => setDetail(null)} />
          </Sheet>
        ) : null
      }>
      <StepHead label="사전 준비 · 동의·서명" index={3} total={4} title={'동의하고\n서명해 주세요'} />
      <Card style={{ gap: gap[4] }}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: all }} onPress={() => setAgreed(all ? [] : items.map((i) => i.id))} style={styles.row}>
          <Check on={all} />
          <Txt t="body/medium-bold">필수 항목 모두 동의</Txt>
        </Pressable>
        <View style={{ height: 1, backgroundColor: C['divider/gray-light'] }} />
        {items.map((i) => (
          <View key={i.id} style={styles.row}>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agreed.includes(i.id) }} onPress={() => toggle(i.id)} style={[styles.row, { flex: 1 }]}>
              <Check on={agreed.includes(i.id)} />
              <Badge label={i.required ? '필수' : '선택'} tone={i.required ? 'primary' : 'gray'} />
              <Txt t="body/small" style={{ flex: 1 }}>
                {i.title}
              </Txt>
            </Pressable>
            <Txt t="body/small-bold" c="text/primary" onPress={() => setDetail(i.id)} accessibilityRole="button">
              보기
            </Txt>
          </View>
        ))}
      </Card>
      <View style={{ gap: gap[3] }}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Txt t="body/medium-bold">서명</Txt>
          <Txt t="body/small-bold" c="text/primary" onPress={() => setPaths([])} accessibilityRole="button">
            다시 쓰기
          </Txt>
        </View>
        <SignaturePad paths={paths} onChange={setPaths} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: gap[3] },
  check: { width: 24, height: 24, borderRadius: radius.small, borderWidth: 1.5, borderColor: C['border/gray-dark'], alignItems: 'center', justifyContent: 'center', backgroundColor: C['surface/white'] },
  checkOn: { backgroundColor: C['element/primary'], borderColor: C['element/primary'] },
  pad: { height: 160, borderRadius: radius.xlarge, borderWidth: 1, borderStyle: 'dashed', borderColor: C['border/gray'], backgroundColor: C['surface/white'], overflow: 'hidden', padding: padding[1] },
});
