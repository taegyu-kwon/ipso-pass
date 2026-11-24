import { useSyncExternalStore } from 'react';

// 담당자 모드와 예비군 호출 상태 (모듈 변수).
// 실제 서비스에서는 담당자 계정으로 로그인하면 담당자 메뉴가 열리고, 호출·확인은 서버를 거친다.

export type Mode = 'reservist' | 'admin';
export type Call = { status: 'calling' | 'confirmed'; at: number };

export const MODES: { value: Mode; label: string }[] = [
  { value: 'reservist', label: '예비군' },
  { value: 'admin', label: '담당자' },
];

let mode: Mode = 'reservist';
let calls: Record<string, Call> = {}; // 예비군 id → 호출 상태
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function setMode(next: Mode) {
  if (mode === next) return;
  mode = next;
  emit();
}

export const useMode = () => useSyncExternalStore(subscribe, () => mode);

export function startCall(ids: string[]) {
  const at = Date.now();
  calls = { ...calls, ...Object.fromEntries(ids.map((id): [string, Call] => [id, { status: 'calling', at }])) };
  emit();
}

export function confirmCall(id: string) {
  const c = calls[id];
  if (!c || c.status === 'confirmed') return;
  calls = { ...calls, [id]: { ...c, status: 'confirmed' } };
  emit();
}

export const useCalls = () => useSyncExternalStore(subscribe, () => calls);
