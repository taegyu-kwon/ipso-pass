import { Platform } from 'react-native';

import { api } from '@/api';

// 시연용 현황판 (구글 시트 + Apps Script, scripts/board.gs). 입소 단계를 마치면 시트의 이름 칸 색이 바뀐다.
// URL이 없거나 연결이 안 돼도 앱 흐름은 그대로 간다 (보내기만 하고 기다리지 않는다).
const URL = process.env.EXPO_PUBLIC_BOARD_URL;

export type BoardStep = 'prep' | 'entry' | 'security' | 'firearm' | 'item' | 'equipment' | 'reset';

function send(name: string, step: BoardStep, item?: string) {
  // 공개 웹 체험판에서는 보내지 않는다 (방문자마다 시트를 바꾸거나 비우지 않도록)
  if (!URL || Platform.OS === 'web') return;
  // text/plain으로 보내야 Apps Script가 사전 요청(CORS) 없이 받는다
  fetch(URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ name, step, item }) }).catch(() => {});
}

// item: 장비 하나를 받았을 때 그 장비 이름 (시트의 열 제목과 같다)
export function report(step: BoardStep, item?: string) {
  send(api.reservist().name, step, item);
}

// 앱을 새로 띄우면 앱의 시연 상태도 처음으로 돌아가니, 시트의 앱 인물 줄도 같이 비운다
export function resetBoard() {
  api.reservists().forEach((r) => send(r.name, 'reset'));
}
