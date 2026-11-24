import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { api } from '@/api';
import { mask } from '@/lib/mask';
import type { Journey } from '@/state/journey';
import type { IconName } from '@/theme/icons';
import { C, gap, padding, radius } from '@/theme/krds';
import { Photo } from '@/ui/pass';
import { Badge, Card, Icon, ProgressBar, Txt } from '@/ui/primitives';

// H1 훈련 중 홈의 부품: 접히는 입소패스 · 오늘 일정 · 식사·PX

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <View style={styles.cell}>
      <Txt t="body/xsmall" c="text/subtle">
        {k}
      </Txt>
      <Txt t="body/small-bold">{v}</Txt>
    </View>
  );
}

// 접힌 상태가 기본. 펼치면 신원과 입소 절차 다섯 단계를 보여 준다.
export function EntryPassCard({ j }: { j: Journey }) {
  const [open, setOpen] = useState(false);
  const r = api.reservist();
  const t = api.training();
  const items = api.equipment();
  const steps = [
    { title: '사전 준비', desc: '제출 완료', done: j.prep.submitted },
    { title: '입소 인증', desc: `${j.entry.enteredAt ?? ''} 신원 확인`, done: j.entry.entered },
    { title: '카메라 잠금', desc: '앱에서 카메라 잠금', done: j.entry.entered },
    { title: '총기 수령', desc: `${api.firearm().weapon} · NFC 태그`, done: j.receive.firearm === 'done' },
    { title: '장비 수령', desc: `지급 장비 ${j.receive.equipment} / ${items.length}`, done: j.receive.equipment >= items.length },
  ].slice(0, api.hasEquipment() ? 5 : 4);
  const done = steps.filter((s) => s.done).length;

  return (
    <View style={styles.pass}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`입소패스, 입소 절차 완료 ${j.completedAt ?? ''}, ${open ? '접기' : '펼쳐 보기'}`}
        onPress={() => setOpen((v) => !v)}
        style={styles.passHead}>
        <View style={{ flex: 1, gap: gap[1] }}>
          <View style={styles.row}>
            <Icon name="id-card" size={20} color="icon/inverse" />
            <Txt t="body/medium-bold" c="text/inverse">
              입소패스
            </Txt>
          </View>
          <Txt t="body/small" c="text/inverse">
            {j.completedAt} 입소 절차 완료
          </Txt>
        </View>
        <View style={styles.toggle}>
          <Txt t="body/xsmall-bold" c="text/primary">
            {open ? '접기' : '펼쳐 보기'}
          </Txt>
          <View style={open && { transform: [{ rotate: '180deg' }] }}>
            <Icon name="chevron-down" size={14} color="icon/primary" />
          </View>
        </View>
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(200)} style={styles.passBody}>
          <View style={[styles.row, { gap: gap[5] }]}>
            <Photo w={72} h={90} />
            <View style={{ flex: 1, gap: gap[1], alignItems: 'flex-start' }}>
              <Badge label="입소 절차 완료" tone="success" />
              <Txt t="heading/medium" c="text/bolder">
                {r.name}
              </Txt>
              <Txt t="body/small" c="text/subtle">
                {j.entry.enteredAt} 현장 입장 확인
              </Txt>
            </View>
          </View>
          <View style={styles.grid}>
            <Cell k="소속" v={r.unit} />
            <Cell k="주특기" v={r.specialty} />
            <Cell k="군번" v={mask(r.serviceNo)} />
            <Cell k="훈련 유형" v={t.kind} />
          </View>
          <View style={{ gap: gap[3] }}>
            <View style={styles.between}>
              <Txt t="body/medium-bold">입소 절차</Txt>
              <Txt t="body/small-bold" c="text/primary">
                {done} / {steps.length} 완료
              </Txt>
            </View>
            {steps.map((s) => (
              <View key={s.title} style={styles.step}>
                <Icon name={s.done ? 'success-fill' : 'clock'} size={20} color={s.done ? 'icon/success' : 'icon/gray-light'} />
                <Txt t="body/small-bold" style={{ flex: 1 }}>
                  {s.title}
                </Txt>
                <Txt t="body/xsmall" c="text/subtle">
                  {s.desc}
                </Txt>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

// 오늘 일정: 진행률 막대 + 시간표. 지금 하는 일은 강조한다.
// shortcut: 지금 순서는 시연용으로 두 번째 일정에 고정, 실제로는 현재 시각과 비교해 정한다
const NOW = 1;
export function TodaySchedule() {
  const schedule = api.daySchedule();
  const pct = Math.round(((NOW + 0.5) / schedule.length) * 100);
  return (
    <Card style={{ gap: gap[4] }}>
      <View style={styles.between}>
        <View style={styles.row}>
          <Icon name="calendar-line" size={20} color="icon/primary" />
          <Txt t="body/medium-bold">오늘의 훈련 일정</Txt>
        </View>
        <Txt t="body/xsmall-bold" c="text/subtle">
          TODAY
        </Txt>
      </View>
      <View style={{ gap: gap[2] }}>
        <View style={styles.between}>
          <Txt t="body/xsmall" c="text/subtle">
            오늘 훈련 진행률 · {schedule[NOW].what} 중
          </Txt>
          <Txt t="body/small-bold" c="text/primary">
            {pct}%
          </Txt>
        </View>
        <ProgressBar value={pct} total={100} />
      </View>
      <View style={{ gap: gap[1] }}>
        {schedule.map((s, i) => {
          const now = i === NOW;
          const past = i < NOW;
          return (
            <View key={s.time} style={[styles.slot, now && styles.slotNow]}>
              <Txt t={now ? 'body/small-bold' : 'body/small'} c={now ? 'text/primary' : past ? 'text/subtle' : 'text/basic'} style={{ width: 48 }}>
                {s.time}
              </Txt>
              <Txt t={now ? 'body/small-bold' : 'body/small'} c={past ? 'text/subtle' : 'text/basic'} style={{ flex: 1 }}>
                {s.what}
              </Txt>
              {/* Badge는 스스로 위에 붙으므로 감싸서 가운데 맞춤 */}
              {now || past ? <View>{now ? <Badge label="진행 중" tone="primary" /> : <Badge label="완료" />}</View> : null}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function Tile({ icon, title, accent, lines }: { icon: IconName; title: string; accent: string; lines: string[] }) {
  return (
    <Card style={{ flex: 1, gap: gap[2] }}>
      <View style={styles.tileIcon}>
        <Icon name={icon} size={20} color="icon/primary" />
      </View>
      <Txt t="body/medium-bold">{title}</Txt>
      <Txt t="body/xsmall-bold" c="text/primary">
        {accent}
      </Txt>
      {lines.map((l) => (
        <Txt key={l} t="body/xsmall" c="text/subtle">
          {l}
        </Txt>
      ))}
    </Card>
  );
}

// 훈련장 생활 정보: 점심 · PX
export function CampTiles() {
  const meal = api.meal();
  const px = api.px();
  return (
    <View style={[styles.row, { alignItems: 'stretch', gap: gap[3] }]}>
      <Tile icon="meal" title="점심 메뉴" accent={meal.time} lines={meal.menu.split(' · ')} />
      <Tile icon="store" title="PX 이용 시간" accent={px.place} lines={px.hours} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: gap[2] },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pass: { borderRadius: radius.xlarge, overflow: 'hidden', backgroundColor: C['surface/white'], borderWidth: 1, borderColor: C['border/primary-light'] },
  passHead: { flexDirection: 'row', alignItems: 'center', gap: gap[3], paddingVertical: padding[6], paddingHorizontal: padding[7], backgroundColor: C['color/primary/50'] },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: gap[1], paddingHorizontal: padding[4], paddingVertical: padding[2], borderRadius: radius.max, backgroundColor: C['surface/white'] },
  passBody: { padding: padding[7], gap: gap[6] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: gap[4], paddingVertical: padding[5], paddingHorizontal: padding[6], borderRadius: radius.large, backgroundColor: C['surface/gray-subtler'] },
  cell: { width: '50%', gap: gap[1], paddingRight: padding[3] },
  step: { flexDirection: 'row', alignItems: 'center', gap: gap[3], paddingVertical: padding[4], paddingHorizontal: padding[5], borderRadius: radius.large, backgroundColor: C['surface/gray-subtler'] },
  slot: { flexDirection: 'row', alignItems: 'center', gap: gap[3], minHeight: 44, paddingHorizontal: padding[4], borderRadius: radius.large },
  slotNow: { backgroundColor: C['surface/primary-subtler'] },
  tileIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C['surface/primary-subtler'] },
});
