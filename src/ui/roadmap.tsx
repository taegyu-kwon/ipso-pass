import { StyleSheet, View } from 'react-native';

import { api, RoadmapYear } from '@/api';
import { useJourney } from '@/state/journey';
import { C, gap } from '@/theme/krds';
import { Card, Icon, Txt } from '@/ui/primitives';

// 예비군 기간 전체 로드맵 (홈 아래 카드)

function useRoad() {
  const { j } = useJourney();
  const road = api.roadmap();
  const thisYearDone = j.phase === 'certified';
  const isDone = (y: RoadmapYear) => y.year < road.thisYear || (y.year === road.thisYear && thisYearDone);
  const left = road.years.filter((y) => !isDone(y)).reduce((n, y) => n + y.count, 0);
  return { road, isDone, left };
}

function Dot({ y, done, now }: { y: RoadmapYear; done: boolean; now: boolean }) {
  return (
    <View style={[styles.dot, done && styles.dotDone, now && !done && styles.dotNow, y.count === 0 && styles.dotNone]}>
      {done ? <Icon name="check" size={14} color="text/inverse" /> : null}
    </View>
  );
}

function Summary() {
  const { road, left } = useRoad();
  return (
    <View style={{ gap: gap[1] }}>
      <Txt t="body/medium-bold">예비군 로드맵</Txt>
      <Txt t="body/small" c="text/subtle">
        남은 훈련 {left}회 · {road.endDate}에 끝나요
      </Txt>
    </View>
  );
}

// 홈: 1~8년차를 가로 한 줄로
export function RoadmapCard() {
  const { road, isDone } = useRoad();
  return (
    <Card style={{ gap: gap[5] }}>
      <Summary />
      <View style={styles.road}>
        <View style={styles.roadLine} />
        {road.years.map((y) => {
          const done = isDone(y);
          const now = y.year === road.thisYear;
          return (
            <View key={y.year} style={styles.step} accessible accessibilityLabel={`${y.label} ${y.year}년 ${y.kind} ${done ? '완료' : now ? '올해' : '예정'}`}>
              <Dot y={y} done={done} now={now} />
              <Txt t={now ? 'body/xsmall-bold' : 'body/xsmall'} c={now ? 'text/primary' : 'text/subtle'}>
                {y.label}
              </Txt>
              <Txt t="body/xsmall" c={y.count === 0 ? 'text/disabled-on' : 'text/basic'}>
                {y.kind}
              </Txt>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  road: { flexDirection: 'row' },
  // 점 가운데를 잇는 선 (첫 칸·마지막 칸의 가운데까지)
  roadLine: { position: 'absolute', top: 10, left: '6.25%', right: '6.25%', height: 2, backgroundColor: C['border/gray-light'] },
  step: { flex: 1, alignItems: 'center', gap: gap[1] },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C['border/gray-light'], backgroundColor: C['surface/white'] },
  dotDone: { borderColor: C['element/primary'], backgroundColor: C['element/primary'] },
  dotNow: { borderColor: C['element/primary'], borderWidth: 6 },
  dotNone: { borderStyle: 'dashed' },

});
