import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { api, RosterEntry } from '@/api';
import { mask } from '@/lib/mask';
import { startCall, useCalls } from '@/state/admin';
import { C, gap, padding, radius, type } from '@/theme/krds';
import { BackBar, Screen } from '@/ui/layout';
import { Badge, Button, Card, Segmented, Txt } from '@/ui/primitives';

type Kind = 'person' | 'room' | 'team';

const KINDS: { value: Kind; label: string }[] = [
  { value: 'person', label: '개인' },
  { value: 'room', label: '생활관' },
  { value: 'team', label: '조' },
];

const MESSAGES = ['보급 창구로 와 주세요', '행정반으로 와 주세요', '집합 장소로 이동해 주세요'];

// 확인이 없으면 이 시간 뒤 전화 걸기 버튼을 띄운다
const NO_ANSWER_MS = 30_000;
// 시연: 서버 없이 같은 휴대폰에 수신 화면을 띄우기까지 기다리는 시간
const DEMO_RECEIVE_MS = 3_000;

const ROSTER = api.roster();
const keyOf = (kind: Kind, r: RosterEntry) => (kind === 'person' ? r.id : kind === 'room' ? r.room : r.team);
const labelOf = (kind: Kind, key: string) => (kind === 'person' ? ROSTER.find((r) => r.id === key)!.name : key);

// 담당자 · 예비군 호출
export default function AdminCall() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const calls = useCalls();

  const [kind, setKind] = useState<Kind>('person');
  const [picked, setPicked] = useState<string | null>(id ?? null);
  const [query, setQuery] = useState('');
  const [preset, setPreset] = useState<string | null>(MESSAGES[0]);
  const [typed, setTyped] = useState('');
  // 직접 입력을 고르면 preset은 null
  const message = preset ?? typed.trim();
  const [demoReceive, setDemoReceive] = useState(true);
  const [targets, setTargets] = useState<RosterEntry[]>([]);
  const [now, setNow] = useState(0);

  const demoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(demoTimer.current), []);

  // 호출 중인 사람이 있는 동안만 1초마다 경과 시간을 다시 그린다
  const waiting = targets.some((t) => calls[t.id]?.status === 'calling');
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [waiting]);

  // 인원이 많으니 이름(개인) · 생활관 · 조 이름으로 찾는다
  const q = query.trim();
  const groups = [...new Set(ROSTER.map((r) => keyOf(kind, r)))].filter((g) => labelOf(kind, g).includes(q));

  const call = () => {
    if (!picked || !message) return;
    Keyboard.dismiss();
    const members = ROSTER.filter((r) => keyOf(kind, r) === picked);
    startCall(members.map((m) => m.id));
    setTargets(members);
    setNow(Date.now());
    clearTimeout(demoTimer.current);
    if (demoReceive) {
      // 시연: 첫 번째 대상자의 휴대폰이 이 휴대폰이라고 보고 수신 화면을 띄운다
      const params = { id: members[0].id, message, at: String(Date.now()) };
      demoTimer.current = setTimeout(() => router.push({ pathname: '/call-receive', params }), DEMO_RECEIVE_MS);
    }
  };

  return (
    <Screen bar={<BackBar title="예비군 호출" />} footer={<Button label="호출하기" disabled={!picked || !message} onPress={call} />}>
      {targets.length ? (
        <Card style={{ gap: gap[4] }}>
          <Txt t="heading/xsmall" c="text/bolder">
            {message}
          </Txt>
          {targets.map((t) => {
            const c = calls[t.id];
            const confirmed = c?.status === 'confirmed';
            const noAnswer = c && !confirmed && now - c.at >= NO_ANSWER_MS;
            return (
              <View key={t.id} style={styles.status}>
                <View style={styles.statusHead}>
                  <Txt t="heading/small" c="text/bolder" style={{ flex: 1 }}>
                    {t.name}
                  </Txt>
                  {c && !confirmed ? (
                    <Txt t="body/small" c="text/subtle">
                      {Math.max(0, Math.floor((now - c.at) / 1000))}초
                    </Txt>
                  ) : null}
                  <Badge label={confirmed ? '확인함' : '호출 중'} tone={confirmed ? 'success' : 'warning'} />
                </View>
                {noAnswer ? (
                  <Button
                    kind="secondary"
                    size="M"
                    icon="call"
                    label={`전화 걸기 · ${mask(t.phone)}`}
                    onPress={() => Linking.openURL(`tel:${t.phone.replace(/\D/g, '')}`).catch(() => {})}
                  />
                ) : null}
              </View>
            );
          })}
        </Card>
      ) : null}

      <View style={{ gap: gap[4] }}>
        <Txt t="heading/small" c="text/bolder">
          누구를 부를까요?
        </Txt>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={kind === 'person' ? '이름으로 찾기' : `${KINDS.find((k) => k.value === kind)!.label} 이름으로 찾기`}
          placeholderTextColor={C['text/disabled']}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="부를 사람 찾기"
          style={[styles.input, type('body/large'), { color: C['text/basic'] }]}
        />
        <Segmented
          options={KINDS}
          value={kind}
          onChange={(k) => {
            setKind(k);
            setPicked(null);
          }}
        />
        <View style={styles.chips}>
          {groups.map((g) => {
            const on = g === picked;
            const count = ROSTER.filter((r) => keyOf(kind, r) === g).length;
            return (
              <Pressable key={g} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setPicked(g)} style={[styles.chip, on && styles.chipOn]}>
                <Txt t="body/large-bold" c={on ? 'text/primary' : 'text/basic'}>
                  {kind === 'person' ? labelOf(kind, g) : `${g} · ${count}명`}
                </Txt>
              </Pressable>
            );
          })}
          {!groups.length ? (
            <Txt t="body/medium" c="text/subtle">
              찾는 결과가 없어요
            </Txt>
          ) : null}
        </View>
      </View>

      <View style={{ gap: gap[4] }}>
        <Txt t="heading/small" c="text/bolder">
          보낼 말
        </Txt>
        {[...MESSAGES, null].map((m) => {
          const on = m === preset;
          return (
            <Pressable key={m ?? 'typed'} accessibilityRole="radio" accessibilityState={{ checked: on }} onPress={() => setPreset(m)} style={[styles.message, on && styles.chipOn]}>
              <View style={[styles.radio, on && styles.radioOn]} />
              <Txt t={on ? 'body/large-bold' : 'body/large'} c={on ? 'text/primary' : 'text/basic'}>
                {m ?? '직접 입력'}
              </Txt>
            </Pressable>
          );
        })}
        {preset === null ? (
          <TextInput
            value={typed}
            onChangeText={setTyped}
            autoFocus
            maxLength={40}
            placeholder="예: 3번 사격장으로 와 주세요"
            placeholderTextColor={C['text/disabled']}
            accessibilityLabel="보낼 말 직접 입력"
            style={[styles.input, type('body/large'), { color: C['text/basic'] }]}
          />
        ) : null}
      </View>

      {/* 시연용 설정. 끄면 수신 화면 없이 30초 미확인 → 전화 걸기를 보여 줄 수 있다 */}
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: demoReceive }} onPress={() => setDemoReceive((v) => !v)} style={styles.demo}>
        <Txt t="body/small" c="text/subtle" style={{ flex: 1 }}>
          시연: 3초 뒤 이 휴대폰에 수신 화면 띄우기
        </Txt>
        <Badge label={demoReceive ? '켬' : '끔'} tone={demoReceive ? 'primary' : 'gray'} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { gap: gap[3], padding: padding[6], borderRadius: radius.large, backgroundColor: C['surface/gray-subtler'] },
  statusHead: { flexDirection: 'row', alignItems: 'center', gap: gap[3] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: gap[3] },
  chip: { paddingHorizontal: padding[7], height: 52, justifyContent: 'center', borderRadius: radius.max, borderWidth: 1, borderColor: C['border/gray-light'], backgroundColor: C['surface/white'] },
  chipOn: { borderColor: C['border/primary'], backgroundColor: C['surface/primary-subtler'] },
  message: { flexDirection: 'row', alignItems: 'center', gap: gap[4], padding: padding[7], borderRadius: radius.xlarge, borderWidth: 1, borderColor: C['border/gray-light'], backgroundColor: C['surface/white'] },
  radio: { width: 22, height: 22, borderRadius: radius.max, borderWidth: 2, borderColor: C['border/gray'] },
  radioOn: { borderWidth: 7, borderColor: C['border/primary'] },
  input: { minHeight: 56, paddingHorizontal: padding[6], borderRadius: radius.medium3, borderWidth: 1, borderColor: C['input/border'], backgroundColor: C['surface/white'] },
  demo: { flexDirection: 'row', alignItems: 'center', gap: gap[3] },
});
