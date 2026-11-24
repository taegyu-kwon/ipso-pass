import { createContext, ReactNode, useContext } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { api } from '@/api';
import { C, ColorToken, gap, padding, radius } from '@/theme/krds';
import { LiveBand, Watermark } from '@/ui/pass-security';
import { Badge, Icon, Tone, Txt } from '@/ui/primitives';

// 남색 카드(담당자에게 보여 주는 패스) 안인지. 글자 색을 흰색 계열로 바꾼다.
const OnDark = createContext(false);

// 사진 자리
export function Photo({ w = 44, h = 56 }: { w?: number; h?: number }) {
  return (
    <View style={[styles.photo, { width: w, height: h }]} accessibilityLabel="본인 사진">
      <Icon name="my" size={w * 0.4} color="icon/gray-light" />
    </View>
  );
}

// 파란 머리띠 + 흰 알약(입소 D-1 · 오늘 · 사용 불가)
export function PassHeader({ pill, dark, live, onPillLongPress }: { pill: string; dark?: boolean; live?: boolean; onPillLongPress?: () => void }) {
  return (
    <View style={[styles.header, dark && { backgroundColor: C['border/gray-dark'] }, live && styles.headerLive, live && dark && { backgroundColor: C['pass/charcoal'] }]}>
      <View style={styles.row}>
        <Icon name="id-card" size={20} color="icon/inverse" />
        <Txt t="body/medium-bold" c="text/inverse">
          입소패스
        </Txt>
      </View>
      <Pressable onLongPress={onPillLongPress} delayLongPress={600} disabled={!onPillLongPress} style={styles.pill}>
        <Txt t="body/small-bold" c={dark ? 'text/subtle' : 'text/primary'}>
          {pill}
        </Txt>
      </Pressable>
    </View>
  );
}

// 훈련 정보는 사진 아래 회색 상자 한 줄에: 훈련일 · 입소 시간 · 훈련 유형
function InfoCell({ k, v, c }: { k: string; v: string; c?: ColorToken }) {
  const onDark = useContext(OnDark);
  return (
    <View style={{ flex: 1, gap: gap[1] }}>
      <Txt t="body/xsmall" c={onDark ? 'pass/subtle' : 'text/subtle'}>
        {k}
      </Txt>
      <Txt t="body/small-bold" c={onDark ? (c ? 'pass/accent' : 'text/inverse') : (c ?? 'text/basic')}>
        {v}
      </Txt>
    </View>
  );
}

export function TrainingInfo() {
  const t = api.training();
  const onDark = useContext(OnDark);
  return (
    <View style={[styles.info, onDark && styles.infoDark]}>
      <InfoCell k="훈련일" v={t.dateLabel} />
      <InfoCell k="입소 시간" v={`${t.deadline}까지`} c="text/primary" />
      <InfoCell k="훈련 유형" v={t.kind} />
    </View>
  );
}

// 입소패스 화면용 얼굴: 사진을 크게 가운데 두고 이름·연차·상태를 아래에
export function PassFace({ badge, big }: { badge?: { label: string; tone: Tone }; big?: boolean }) {
  const r = api.reservist();
  const onDark = useContext(OnDark);
  return (
    <View style={{ alignItems: 'center', gap: gap[3] }}>
      <Photo w={big ? 144 : 104} h={big ? 180 : 130} />
      <View style={{ alignItems: 'center', gap: gap[1] }}>
        <Txt t="heading/large" c={onDark ? 'text/inverse' : 'text/bolder'}>
          {r.name}
        </Txt>
        <Txt t="body/small" c={onDark ? 'pass/subtle' : 'text/subtle'}>
          {r.yearLabel}
        </Txt>
        {badge ? (
          <View style={{ marginTop: gap[1] }}>
            <Badge {...badge} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

// 훈련장 한 줄: 이름 · 길찾기 · 전화 (홈 입소패스 카드 맨 아래)
export function PlaceRow() {
  const t = api.training();
  const onDark = useContext(OnDark);
  const link = onDark ? 'pass/accent' : 'text/primary';
  return (
    <View style={styles.place}>
      <Icon name="location" size={20} color={onDark ? 'pass/accent' : 'icon/primary'} />
      <Txt t="body/small-bold" c={onDark ? 'text/inverse' : 'text/basic'} style={{ flex: 1 }}>
        {t.siteName}
      </Txt>
      <Txt
        t="body/small-bold"
        c={link}
        accessibilityRole="link"
        suppressHighlighting
        style={styles.placeLink}
        onPress={() => Linking.openURL(`https://map.naver.com/p/search/${encodeURIComponent(t.siteAddress)}`)}>
        길찾기
      </Txt>
      <Txt t="body/small-bold" c={link} accessibilityRole="link" suppressHighlighting style={styles.placeLink} onPress={() => Linking.openURL(`tel:${t.unitPhone}`)}>
        전화
      </Txt>
    </View>
  );
}

// live: 담당자에게 보여 주는 남색 카드. 배경 무늬와 보안 띠·실시간 시계를 더하고, 남는 화면 높이를 꽉 채운다.
export function PassCard({ pill, dark, live, onPillLongPress, children }: { pill: string; dark?: boolean; live?: boolean; onPillLongPress?: () => void; children: ReactNode }) {
  return (
    <View style={[styles.card, live && styles.cardLive]}>
      <PassHeader pill={pill} dark={dark} live={live} onPillLongPress={onPillLongPress} />
      <View style={[styles.body, live && styles.bodyFill]}>
        {live ? <Watermark dark={dark} /> : null}
        <OnDark.Provider value={!!live}>{children}</OnDark.Provider>
      </View>
      {live ? <LiveBand dark={dark} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    borderRadius: radius.medium3,
    borderWidth: 1,
    borderColor: C['border/gray-light'],
    backgroundColor: C['surface/secondary-subtler'],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: padding[5],
    paddingHorizontal: padding[7],
    backgroundColor: C['color/primary/50'],
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: gap[2] + 2 },
  place: { flexDirection: 'row', alignItems: 'center', gap: gap[2] },
  placeLink: { paddingVertical: padding[3], paddingHorizontal: padding[2] },
  info: { flexDirection: 'row', gap: gap[3], paddingVertical: padding[5], paddingHorizontal: padding[6], borderRadius: radius.large, backgroundColor: C['surface/gray-subtler'] },
  pill: {
    paddingHorizontal: padding[4],
    paddingVertical: padding[1],
    borderRadius: radius.max,
    backgroundColor: C['surface/white'],
  },
  card: {
    borderRadius: radius.xlarge,
    borderWidth: 1,
    borderColor: C['border/primary-light'],
    backgroundColor: C['surface/white'],
    overflow: 'hidden',
  },
  body: { padding: padding[7], gap: gap[4] },
  cardLive: { flex: 1, borderWidth: 0, backgroundColor: C['pass/navy'] },
  headerLive: { backgroundColor: C['pass/navy'], borderBottomWidth: 1, borderBottomColor: C['pass/line'] },
  infoDark: { backgroundColor: C['pass/fill'], borderWidth: 1, borderColor: C['pass/line'] },
  // 얼굴은 남는 공간 가운데, 훈련 정보는 아래에
  bodyFill: { flex: 1, justifyContent: 'space-around' },
});
