import DUMMY from '../../assets/data/dummy.json';
import type { Account, Consent, EquipmentItem, HealthQuestion, Meal, Px, Reservist, Roadmap, RosterEntry, ScheduleItem, SubmitResult, Training } from './types';

export type * from './types';

// 화면이 부르는 데이터 계층.
// 지금은 더미 데이터(assets/data/dummy.json)를 돌려주고, 실제 연동 시 이 파일의 함수 본문만 국방동원정보체계 API 호출로 바꾼다.
// 네트워크 없이 시연해야 하므로 모든 값은 앱 안에 들어 있다.
// shortcut: 연차별 훈련 유형·횟수(roadmaps)는 GPT가 만든 예시라 실제 제도와 다를 수 있다, 발표 전 실제 기준으로 바꾼다

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const RESERVISTS: Reservist[] = DUMMY.reservists;

// 지금 보고 있는 예비군 (시연 패널에서 고른다). 실제 서비스에서는 로그인한 본인이다.
let current = RESERVISTS[0].id;
const mine = <T extends { reservistId: string }>(xs: T[]): T => {
  const x = xs.find((v) => v.reservistId === current);
  if (!x) throw new Error(`${current}의 데이터가 없어요`);
  return x;
};

const TRAININGS: Training[] = DUMMY.trainings;

export const api = {
  reservists: () => RESERVISTS,
  // 없는 id(예: 고르기 전 상태)면 첫 번째 인물을 쓴다
  setReservist: (id?: string) => {
    current = RESERVISTS.some((r) => r.id === id) ? id! : RESERVISTS[0].id;
  },
  reservist: () => RESERVISTS.find((r) => r.id === current)!,
  training: () => mine(TRAININGS),
  // 기본훈련은 출퇴근 훈련이라 장비를 지급하지 않는다 (총기만 지급)
  hasEquipment: () => mine(TRAININGS).kind !== '기본훈련',
  roadmap: (): Roadmap => mine(DUMMY.roadmaps),
  savedAccount: (): Account => mine(DUMMY.accounts),
  daySchedule: (): ScheduleItem[] => (api.hasEquipment() ? DUMMY.daySchedule : DUMMY.daySchedule.map((x) => ({ ...x, what: x.what.replace('장비', '총기') }))),
  meal: (): Meal => DUMMY.meal,
  px: (): Px => DUMMY.px,
  healthQuestions: (): HealthQuestion[] => DUMMY.health,
  consents: (): Consent[] => DUMMY.consents,
  equipment: (): EquipmentItem[] => DUMMY.equipment,
  firearm: () => DUMMY.firearm,

  // 담당자 화면
  roster: (): RosterEntry[] => DUMMY.reservists,

  // 계좌 예금주 확인 (가정: 은행 조회). 시연에서는 끝자리 0000이면 실패
  async verifyAccount(number: string): Promise<boolean> {
    await wait(700);
    return !number.endsWith('0000');
  },

  // 사전 준비 제출
  async submitPrep(input: { failOnce?: boolean }): Promise<SubmitResult> {
    await wait(1400);
    if (input.failOnce) return { ok: false, reason: 'network' };
    return { ok: true, submittedAt: '11.11' };
  },
};
