// 국방동원정보체계와 주고받을 것으로 가정한 데이터 모양.
// 실제 연동 시에도 화면은 이 타입만 본다.

// 개인정보는 전체 값으로 두고 화면에 보일 때 가린다 (src/lib/mask.ts)
export type Reservist = {
  id: string;
  name: string;
  yearLabel: string; // 2년차 · 동원미참훈련
  birth: string; // 2001.03.14
  unit: string;
  address: string;
  phone: string;
  serviceNo: string; // 군번
  specialty: string; // 주특기
};

export type Training = {
  id: string;
  reservistId: string;
  siteId: string; // 국방부 「예비군 훈련장 정보」의 훈련장
  title: string; // 2년차 동원미참훈련
  kind: string; // 훈련 유형: 동원미참훈련
  dateLabel: string; // 11.12 (목)
  start: string; // 09:00
  end: string; // 16:30
  deadline: string; // 입소 마감 08:50
  siteName: string;
  siteAddress: string;
  unitPhone: string;
};

// 예비군 기간 전체의 연차별 훈련 (로드맵). count 0은 훈련 없이 소집점검만 있는 해.
export type RoadmapYear = { year: number; label: string; kind: string; count: number };
export type Roadmap = { reservistId: string; endDate: string; thisYear: number; years: RoadmapYear[] };

export type HealthQuestion = { id: string; text: string; flagIfYes: boolean };

export type Account = { reservistId: string; bank: string; number: string; holder: string };

export type Consent = { id: string; title: string; required: boolean; summary: string };

export type EquipmentItem = { id: string; name: string };

// 훈련 당일 시간표와 훈련장 생활 정보
export type ScheduleItem = { time: string; what: string };
export type Meal = { time: string; menu: string };
export type Px = { place: string; hours: string[] };

export type FirearmIssue = { weapon: string; recordedAt?: string };

// 준비 제출 결과
export type SubmitResult = { ok: true; submittedAt: string } | { ok: false; reason: 'network' };

// 담당자 화면: 훈련장 명단 한 줄. equipmentReturned는 반납한 장비 id, 장비를 받지 않은 훈련이면 null
export type RosterEntry = Reservist & { room: string; team: string; entered: boolean; equipmentReturned: string[] | null };

