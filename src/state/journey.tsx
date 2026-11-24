import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

import { api } from '@/api';

// 한 훈련의 진행 상태. 실제 서비스에서는 국방동원정보체계가 내려주는 상태이고,
// 시연에서는 앱 안에서 바뀌며 시연 패널로 원하는 장면에 바로 갈 수 있다.

export type Phase = 'unscheduled' | 'dayBefore' | 'today' | 'training' | 'finished' | 'certified';
export type Answer = 'yes' | 'no';

export type Journey = {
  signedIn: boolean;
  reservistId: string; // 시연 패널에서 고른 예비군
  phase: Phase;
  prep: {
    basic: boolean;
    // 건강 문진 (입소 시작 직후 첫 단계에서 작성)
    answers: Record<string, Answer>;
    healthSubmitted: boolean;
    account: boolean;
    consents: string[];
    signed: boolean;
    submitted: boolean;
    healthCheck: 'clear' | 'needs_check';
  };
  scheduleChanged: boolean;
  entry: { entered: boolean; enteredAt?: string };
  receive: { equipment: number; firearm: 'waiting' | 'done' };
  completedAt?: string;
  exit: { firearm: 'waiting' | 'done'; equipment: number; unlocked: boolean; done: boolean };
  // 시연용 시뮬레이션 설정
  sim: {
    securityResult: 'locked' | 'unknown'; // 앱에서 카메라 잠금 성공 / 실패
    tag: 'ok' | 'fail' | 'unsupported' | 'network';
    submitFail: boolean;
  };
};

const EMPTY_PREP: Journey['prep'] = {
  basic: false,
  answers: {},
  healthSubmitted: false,
  account: false,
  consents: [],
  signed: false,
  submitted: false,
  healthCheck: 'clear',
};

const ALL_NO: Record<string, Answer> = Object.fromEntries(api.healthQuestions().map((q) => [q.id, 'no']));
const DONE_PREP: Journey['prep'] = {
  basic: true,
  answers: {},
  healthSubmitted: false,
  account: true,
  consents: api.consents().map((c) => c.id),
  signed: true,
  submitted: true,
  healthCheck: 'clear',
};

const BASE: Journey = {
  signedIn: true,
  reservistId: api.reservists()[0].id,
  phase: 'dayBefore',
  prep: EMPTY_PREP,
  scheduleChanged: false,
  entry: { entered: false },
  receive: { equipment: 0, firearm: 'waiting' },
  exit: { firearm: 'waiting', equipment: 0, unlocked: false, done: false },
  sim: { securityResult: 'locked', tag: 'ok', submitFail: false },
};

// 시연 패널에서 고르는 장면
export const SCENARIOS = {
  d1New: { label: '입소 하루 전 · 준비 전', make: (): Journey => ({ ...BASE }) },
  d1Mid: {
    label: '입소 하루 전 · 작성 중 (2/4)',
    make: (): Journey => ({ ...BASE, prep: { ...EMPTY_PREP, basic: true, account: true } }),
  },
  d1Ready: { label: '입소 하루 전 · 사전 준비 완료', make: (): Journey => ({ ...BASE, prep: DONE_PREP }) },
  todayMid: {
    label: '훈련 당일 · 준비 미완료 (2/4)',
    make: (): Journey => ({ ...BASE, phase: 'today', prep: { ...EMPTY_PREP, basic: true, account: true } }),
  },
  todayReady: { label: '훈련 당일 · 사전 준비 완료', make: (): Journey => ({ ...BASE, phase: 'today', prep: DONE_PREP }) },
  todayCheck: {
    label: '훈련 당일 · 문진 담당자 확인 필요',
    make: (): Journey => ({ ...BASE, phase: 'today', prep: { ...DONE_PREP, answers: { ...ALL_NO, hq3: 'yes' }, healthSubmitted: true, healthCheck: 'needs_check' } }),
  },
  changed: { label: '일정 변경으로 패스 사용 불가', make: (): Journey => ({ ...BASE, phase: 'today', prep: DONE_PREP, scheduleChanged: true }) },
  training: {
    label: '훈련 중 (입소 절차 완료)',
    make: (): Journey => ({
      ...BASE,
      phase: 'training',
      prep: DONE_PREP,
      entry: { entered: true, enteredAt: '08:42' },
      receive: { equipment: 5, firearm: 'done' },
      completedAt: '09:05',
    }),
  },
} as const;

export type ScenarioKey = keyof typeof SCENARIOS;

// 시연 시계: 작성한 내용은 그대로 두고 날짜만 넘긴다.
// 실제 서비스에서는 오늘 날짜와 훈련일을 비교해 phase가 정해진다.
export const DAYS: { phase: Phase; label: string }[] = [
  { phase: 'unscheduled', label: '일정 미정' },
  { phase: 'dayBefore', label: '입소 하루 전' },
  { phase: 'today', label: '훈련 당일 아침' },
  { phase: 'certified', label: '이수 반영 후' },
];

export function nextDay(phase: Phase): { phase: Phase; label: string } | null {
  const i = DAYS.findIndex((d) => d.phase === phase);
  return i >= 0 && i < DAYS.length - 1 ? DAYS[i + 1] : null;
}

// 필수 동의를 모두 하고 서명까지 했는지
export function consentsDone(p: Journey['prep']) {
  return p.signed && api.consents().every((c) => !c.required || p.consents.includes(c.id));
}

// 사전 준비 4개 항목 중 끝난 수 (기본 정보 · 지급 계좌 · 동의·서명 · 제출)
export function prepCount(p: Journey['prep']) {
  return [p.basic, p.account, consentsDone(p), p.submitted].filter(Boolean).length;
}

export function remainingItems(p: Journey['prep']) {
  const consentDone = consentsDone(p);
  return [
    !p.basic && '기본 정보',
    !p.account && '지급 계좌',
    !consentDone && '동의·서명',
    !p.submitted && '제출',
  ].filter(Boolean) as string[];
}

// 입소패스 상태 (P5a~e)
export type PassState = 'ready' | 'today' | 'needs_check' | 'unusable' | 'used' | 'incomplete';
export function passState(j: Journey): PassState {
  if (j.scheduleChanged) return 'unusable';
  if (j.phase === 'training' || j.phase === 'finished' || j.phase === 'certified') return 'used';
  if (j.phase === 'today' && !j.prep.submitted) return 'incomplete';
  if (j.prep.healthCheck === 'needs_check') return 'needs_check';
  if (j.phase === 'today') return 'today';
  return 'ready';
}

type Ctx = {
  j: Journey;
  update: (fn: (j: Journey) => Journey) => void;
  setPrep: (patch: Partial<Journey['prep']>) => void;
  load: (key: ScenarioKey) => void;
  setDay: (phase: Phase) => void;
};

const JourneyContext = createContext<Ctx | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  // 앱을 켜면 스플래시 → 로그인부터 시작한다
  const [j, setJ] = useState<Journey>(() => ({ ...SCENARIOS.d1New.make(), signedIn: false }));
  const update = useCallback((fn: (j: Journey) => Journey) => setJ(fn), []);
  const setPrep = useCallback((patch: Partial<Journey['prep']>) => setJ((s) => ({ ...s, prep: { ...s.prep, ...patch } })), []);
  const load = useCallback((key: ScenarioKey) => setJ((s) => ({ ...SCENARIOS[key].make(), sim: s.sim, reservistId: s.reservistId })), []);
  const setDay = useCallback((phase: Phase) => setJ((s) => ({ ...s, phase })), []);
  // 화면은 api만 부르므로, 고른 예비군을 데이터 계층에 먼저 알려 준다
  api.setReservist(j.reservistId);
  const value = useMemo(() => ({ j, update, setPrep, load, setDay }), [j, update, setPrep, load, setDay]);
  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('JourneyProvider 밖에서 useJourney를 썼어요');
  return ctx;
}
