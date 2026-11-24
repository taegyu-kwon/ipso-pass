import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { api } from '@/api';
import { mask } from '@/lib/mask';
import { useJourney } from '@/state/journey';
import { C, gap, padding, radius, type } from '@/theme/krds';
import { BackBar, Screen, StepHead } from '@/ui/layout';
import { Button, Icon, Notice, Txt } from '@/ui/primitives';

function Radio({ on }: { on: boolean }) {
  return <View style={[styles.radio, on && { borderColor: C['element/primary'], borderWidth: 7 }]} />;
}

// P2 지급 계좌: 지난 훈련 계좌 사용 / 다른 계좌 입력(P2-1, 예금주 확인 실패 표시)
export default function Account() {
  const { setPrep } = useJourney();
  const saved = api.savedAccount();
  const [mode, setMode] = useState<'saved' | 'new'>('saved');
  const [number, setNumber] = useState('');
  const [state, setState] = useState<'idle' | 'checking' | 'error'>('idle');

  const next = async () => {
    if (mode === 'new') {
      setState('checking');
      const ok = await api.verifyAccount(number);
      if (!ok) return setState('error');
    }
    setPrep({ account: true });
    router.replace('/prep/consent');
  };

  return (
    <Screen
      bar={<BackBar title="사전 준비" />}
      footer={<Button label={state === 'checking' ? '예금주 확인 중' : state === 'error' ? '다시 확인' : '다음'} disabled={state === 'checking' || (mode === 'new' && number.length < 8)} onPress={next} />}>
      <StepHead label="사전 준비 · 지급 계좌" index={2} total={4} title={'보상비·여비를 받을\n계좌를 확인해 주세요'} />
      <Pressable accessibilityRole="radio" accessibilityState={{ checked: mode === 'saved' }} onPress={() => setMode('saved')} style={[styles.option, mode === 'saved' && styles.on]}>
        <Radio on={mode === 'saved'} />
        <View style={{ flex: 1, gap: gap[1] }}>
          <Txt t="body/medium-bold">지난 훈련 때 계좌 사용</Txt>
          <Txt t="body/small" c="text/subtle">
            {saved.bank} {mask(saved.number)} · 예금주 {saved.holder}
          </Txt>
        </View>
      </Pressable>
      <Pressable accessibilityRole="radio" accessibilityState={{ checked: mode === 'new' }} onPress={() => setMode('new')} style={[styles.option, mode === 'new' && styles.on]}>
        <Radio on={mode === 'new'} />
        <Txt t="body/medium-bold" style={{ flex: 1 }}>
          다른 계좌 입력
        </Txt>
      </Pressable>
      {mode === 'new' ? (
        <View style={{ gap: gap[5] }}>
          <View style={{ gap: gap[3] }}>
            <Txt t="body/small-bold">은행</Txt>
            <View style={styles.input}>
              <Txt t="body/medium">{saved.bank}</Txt>
              <Icon name="chevron-down" size={20} color="icon/gray-light" />
            </View>
          </View>
          <View style={{ gap: gap[3] }}>
            <Txt t="body/small-bold">계좌번호</Txt>
            <TextInput
              value={number}
              onChangeText={(v) => {
                setNumber(v.replace(/[^0-9-]/g, ''));
                if (state === 'error') setState('idle');
              }}
              keyboardType="number-pad"
              placeholder="숫자만 입력"
              placeholderTextColor={C['text/disabled']}
              style={[styles.input, type('body/medium'), { color: C['text/basic'] }, state === 'error' && { borderColor: C['input/border-error'], borderWidth: 2 }]}
            />
            {state === 'error' ? (
              <Txt t="body/xsmall" c="text/danger">
                예금주 확인에 실패했어요. 계좌번호를 다시 확인해 주세요.
              </Txt>
            ) : null}
          </View>
          <View style={{ gap: gap[3] }}>
            <Txt t="body/small-bold">예금주</Txt>
            <View style={[styles.input, { backgroundColor: C['input/surface-disabled'], borderColor: C['border/gray'] }]}>
              <Txt t="body/medium" c="text/disabled-on">
                {saved.holder} (본인)
              </Txt>
            </View>
          </View>
        </View>
      ) : (
        <Notice title="본인 명의 계좌만 쓸 수 있어요" />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap[4],
    padding: padding[7],
    borderRadius: radius.xlarge,
    borderWidth: 1,
    borderColor: C['border/gray-light'],
    backgroundColor: C['surface/white'],
  },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C['border/gray-dark'], backgroundColor: C['surface/white'] },
  on: { borderColor: C['border/primary'], borderWidth: 2, backgroundColor: C['surface/primary-subtler'] },
  input: {
    height: 56,
    paddingHorizontal: padding[6],
    borderRadius: radius.medium3,
    borderWidth: 1,
    borderColor: C['input/border'],
    backgroundColor: C['surface/white'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
