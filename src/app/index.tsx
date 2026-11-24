import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { api } from '@/api';
import { Journey, nextDay, prepCount, remainingItems, useJourney } from '@/state/journey';
import { gap } from '@/theme/krds';
import { HomeBar, Screen } from '@/ui/layout';
import { PassCard, PassFace, PlaceRow, TrainingInfo } from '@/ui/pass';
import { Badge, Button, Card, Icon, KV, Notice, ProgressBar, Txt } from '@/ui/primitives';
import { RoadmapCard } from '@/ui/roadmap';
import { Sheet } from '@/ui/sheet';
import { CampTiles, EntryPassCard, TodaySchedule } from '@/ui/today';

// 홈은 날짜와 준비 상태에 따라 바뀐다.
//  03-1 일정 미정 → 03-0a/b/c 하루 전(준비 전·작성 중·사전 준비 완료) → 04-0a/b 당일 → H1 훈련 중
//  → 퇴소 후 → 03-2 이수 반영 후
export default function Home() {
  const { j, setDay } = useJourney();
  const [skip, setSkip] = useState(false);
  const next = nextDay(j.phase);
  const openSkip = next ? () => setSkip(true) : undefined;
  // 처음 켜면 스플래시를 거친다
  if (!j.signedIn) return <Redirect href="/splash" />;
  let content;
  let footer;
  if (j.phase === 'unscheduled') content = <UnscheduledHome onSkip={openSkip} />;
  else if (j.phase === 'dayBefore') content = <PrepHome j={j} onSkip={openSkip} />;
  else if (j.phase === 'today') content = <TodayHome j={j} />;
  else if (j.phase === 'training') {
    content = <TrainingHome j={j} />;
    footer = <Button label="퇴소 절차 시작" onPress={() => router.push('/exit/firearm')} />;
  } else if (j.phase === 'finished') content = <FinishedHome />;
  else content = <CertifiedHome />;

  // 남색 입소패스 카드가 나오는 날(하루 전 · 당일)은 흰 바탕
  const passDay = j.phase === 'dayBefore' || j.phase === 'today';
  return (
    <Screen
      bg={passDay ? 'background/white' : undefined}
      bar={<HomeBar />}
      footer={footer}
      overlay={
        skip && next ? (
          // 시연 시계: D-day 알약을 길게 누르면 열린다. 작성한 내용은 그대로 두고 날짜만 넘긴다.
          <Sheet icon="clock" title={`${next.label}로 넘길까요?`} desc="시연용 기능이에요. 작성한 내용은 그대로 두고 날짜만 바뀌어요.">
            <Button
              label={`${next.label}로 넘기기`}
              onPress={() => {
                setDay(next.phase);
                setSkip(false);
              }}
            />
            <Button kind="text" label="취소" onPress={() => setSkip(false)} />
          </Sheet>
        ) : null
      }>
      {content}
    </Screen>
  );
}

// 03-1 훈련 일정이 아직 정해지지 않았을 때 (소집 통지 전)
function UnscheduledHome({ onSkip }: { onSkip?: () => void }) {
  const r = api.reservist();
  const t = api.training();
  return (
    <>
      <View style={{ gap: gap[1] }}>
        <Txt t="body/small" c="text/subtle">
          {r.name} 님
        </Txt>
        <Txt t="heading/medium" c="text/bolder">
          올해 받을 훈련이 1회 있어요
        </Txt>
      </View>
      <Card>
        <View style={styles.between}>
          <Pressable onLongPress={onSkip} delayLongPress={600} hitSlop={8}>
            <Badge label="일정 미정" />
          </Pressable>
          <Txt t="body/small" c="text/subtle">
            2026년
          </Txt>
        </View>
        <Txt t="heading/small" c="text/bolder">
          {t.title}
        </Txt>
        <View style={{ gap: gap[2] }}>
          <ProgressBar value={0} total={1} />
          <Txt t="body/small" c="text/subtle">
            이수 0 / 1회
          </Txt>
        </View>
        <View style={styles.row}>
          <Icon name="shield" size={20} color="icon/gray-light" />
          <Txt t="body/medium">{r.unit}</Txt>
        </View>
      </Card>
      <Notice title="훈련 일정이 정해지면 알림으로 알려 드려요" />
      <RoadmapCard />
    </>
  );
}

// 입소패스 위에 붙는 준비 상태 안내 (하루 전: 작성 중 / 당일: 미완료 경고)
function PrepNotice({ j }: { j: Journey }) {
  if (j.prep.submitted) return null;
  const n = prepCount(j.prep);
  const left = remainingItems(j.prep);
  if (j.phase === 'today')
    return <Notice tone="warning" title="아직 마치지 않은 준비가 있어요" />;
  if (n > 0) return <Notice title={`사전 준비 ${n} / 4`} body={`남은 항목: ${left.join(' · ')}`} />;
  return null;
}

// 03-0a/b/c 입소 하루 전
function PrepHome({ j, onSkip }: { j: Journey; onSkip?: () => void }) {
  const n = prepCount(j.prep);
  const done = j.prep.submitted;
  return (
    <>
      <PrepNotice j={j} />
      <PassCard pill="입소 D-1" live onPillLongPress={onSkip}>
        <PassFace big />
        <View style={{ gap: gap[4] }}>
          <TrainingInfo />
          <PlaceRow />
        </View>
      </PassCard>
      {/* 준비를 마치면 입소 당일에 누를 '입소 시작'을 미리 비활성으로 보여 준다 */}
      {done ? <Button label="입소 시작" disabled /> : <Button label={n === 0 ? '사전 준비하기' : '이어서 준비하기'} onPress={() => router.push('/prep')} />}
    </>
  );
}

// 04-0a/b 훈련 당일
function TodayHome({ j }: { j: Journey }) {
  const done = j.prep.submitted;
  return (
    <>
      <PrepNotice j={j} />
      <PassCard pill="오늘" live>
        <PassFace big />
        <View style={{ gap: gap[4] }}>
          <TrainingInfo />
          <PlaceRow />
        </View>
      </PassCard>
      {done ? (
        <Button label="입소 시작" onPress={() => router.push('/entry/health')} />
      ) : (
        // 준비를 마치면 사전 준비 끝에서 바로 입소 절차로 이어진다
        <Button label="지금 준비 마치기" onPress={() => router.push('/prep')} />
      )}
    </>
  );
}

// H1 훈련 중: 접힌 입소패스 · 오늘 일정 · 점심·PX
function TrainingHome({ j }: { j: Journey }) {
  return (
    <>
      <EntryPassCard j={j} />
      <TodaySchedule />
      <CampTiles />
    </>
  );
}

// 퇴소 후
function FinishedHome() {
  return (
    <>
      <Card style={{ gap: gap[3] }}>
        <Badge label="퇴소 완료" tone="success" />
        <Txt t="heading/small" c="text/bolder">
          오늘 훈련을 마쳤어요
        </Txt>
        <Txt t="body/small" c="text/subtle">
          이수 반영은 부대 확인 후 알림으로 알려 드려요.
        </Txt>
      </Card>
    </>
  );
}

// 03-2 부대 확인으로 이수가 반영된 뒤
function CertifiedHome() {
  const t = api.training();
  return (
    <>
      <Card style={{ gap: gap[4] }}>
        <Badge label="훈련 이수 완료" tone="success" />
        <Txt t="heading/small" c="text/bolder">
          올해 훈련을 모두 마쳤어요
        </Txt>
        <View style={{ gap: gap[2] }}>
          <ProgressBar value={1} total={1} />
          <Txt t="body/small" c="text/subtle">
            2026년 이수 1 / 1회
          </Txt>
        </View>
        <View style={{ gap: gap[2] }}>
          <KV k="훈련" v={t.title} />
          <KV k="훈련일" v={t.dateLabel} />
          <KV k="훈련장" v={t.siteName} />
        </View>
        <Txt t="body/small" c="text/subtle">
          내년 훈련 일정이 정해지면 알림으로 알려 드려요.
        </Txt>
        </Card>
      <RoadmapCard />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: gap[2] },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
