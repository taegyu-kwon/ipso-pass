import { api } from '@/api';
import { mask } from '@/lib/mask';
import { consentsDone, type Journey } from '@/state/journey';
import type { Tone } from '@/ui/primitives';

// P0 허브와 홈이 같이 쓰는 사전 준비 항목 목록
export type PrepItem = { key: string; route: '/prep/basic' | '/prep/account' | '/prep/consent' | '/prep/review'; title: string; desc: string; badge: { label: string; tone: Tone }; done: boolean };

export function prepItems(p: Journey['prep']): PrepItem[] {
  const consentDone = consentsDone(p);
  const allBefore = p.basic && p.account && consentDone;
  return [
    { key: 'basic', route: '/prep/basic', title: '기본 정보 확인', desc: p.basic ? '등록 정보 확인 완료' : '등록된 정보가 맞는지 확인', badge: p.basic ? { label: '완료', tone: 'success' } : { label: '미작성', tone: 'gray' }, done: p.basic },
    { key: 'account', route: '/prep/account', title: '지급 계좌', desc: p.account ? `${api.savedAccount().bank} ${mask(api.savedAccount().number)}` : '보상비·여비 받을 계좌', badge: p.account ? { label: '완료', tone: 'success' } : { label: '미작성', tone: 'gray' }, done: p.account },
    { key: 'consent', route: '/prep/consent', title: '동의·서명', desc: consentDone ? '필수 동의 · 서명 완료' : '필수 2 · 선택 1', badge: consentDone ? { label: '완료', tone: 'success' } : { label: '미작성', tone: 'gray' }, done: consentDone },
    { key: 'review', route: '/prep/review', title: '제출 전 확인', desc: p.submitted ? '11.11 제출' : '모든 항목을 마치면 제출', badge: p.submitted ? { label: '제출 완료', tone: 'success' } : allBefore ? { label: '제출 전', tone: 'primary' } : { label: '제출 전', tone: 'gray' }, done: p.submitted },
  ];
}

