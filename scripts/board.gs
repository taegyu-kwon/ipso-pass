// 시연용 현황판: 앱에서 입소 단계를 마치면 구글 시트 '예비군' 표의 그 사람 줄이 바뀐다.
//  - 이름 칸 색이 단계별로 바뀌고
//  - 단계에 맞는 열(드롭다운)에 값이 들어간다
// 시트 > 확장 프로그램 > Apps Script 에 붙여 넣고, 배포 > 새 배포 > 웹 앱
// (실행: 나, 액세스: 모든 사용자)로 배포한 뒤 나온 URL을 앱의 EXPO_PUBLIC_BOARD_URL에 넣는다.
// URL을 아는 사람은 누구나 고칠 수 있으니 시트에는 더미 이름만 둔다.

// 단계별: 이름 칸 색, 채울 열(첫 줄 제목) → 값. 값은 각 열 드롭다운 항목과 글자가 같아야 한다.
const STEPS = {
  prep: { color: '#e6f0fc', set: { 사전준비: '완료' } },
  entry: { color: '#4c87d9', set: { '입소 시간': 'now', 상태: '진행중' } }, // 입소 인증 (신원 확인)
  security: { color: '#93b0df', set: { '카메라 보안': '잠금' } },
  firearm: { color: '#5fb37a', set: { 총기: '수령 완료' } },
  item: { color: '#5fb37a', set: { 물자: '수령중' } }, // 장비 하나 수령: 보낸 item 이름의 열에 '수령'
  equipment: { color: '#2f8a4c', set: { 물자: '수령 완료', 상태: '입소 완료' } },
};
const ITEMS = ['전투조끼', '군장', '모포', '반합', '야전삽'];
const CLEAR = ['입소 시간', '사전준비', '카메라 보안', '총기', '물자', '상태', ...ITEMS]; // reset 때 비울 열

function doPost(e) {
  const { name, step, item } = JSON.parse(e.postData.contents);
  if (!(step in STEPS) && step !== 'reset') return reply({ ok: false, reason: 'unknown step' });

  // 모든 탭에서 이름과 글자가 똑같은 칸을 찾는다
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cell = ss.createTextFinder(name).matchEntireCell(true).findNext();
  if (!cell) return reply({ ok: false, reason: 'name not found' });
  const sheet = cell.getSheet();
  const row = cell.getRow();

  // 제목 줄: 이름 칸 바로 위쪽에서 '이름'이라고 적힌 줄
  const headers = sheet.getRange(1, 1, row - 1, sheet.getLastColumn()).getValues();
  const headerRow = headers.findIndex((r) => r.some((h) => String(h).trim() === '이름'));
  // 제목 앞뒤 공백은 무시 (예: ' 전투조끼')
  const cols = headerRow < 0 ? [] : headers[headerRow].map((h) => String(h).trim());
  const col = (title) => cols.indexOf(title) + 1; // 없으면 0

  if (step === 'reset') {
    cell.setBackground(null).setFontColor(null);
    CLEAR.forEach((t) => col(t) && sheet.getRange(row, col(t)).clearContent());
    return reply({ ok: true });
  }

  const s = { ...STEPS[step], set: { ...STEPS[step].set } };
  if (step === 'item' && ITEMS.includes(item)) s.set[item] = '수령';
  cell.setBackground(s.color).setFontColor(step === 'prep' ? null : '#ffffff');
  const now = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'HH:mm');
  const missing = [];
  Object.entries(s.set).forEach(([title, value]) => {
    if (!col(title)) return missing.push(title);
    sheet.getRange(row, col(title)).setValue(value === 'now' ? now : value);
  });
  return reply({ ok: true, row, missing });
}

// 브라우저에서 URL을 열면 살아 있는지 확인할 수 있다
function doGet() {
  return reply({ ok: true });
}

function reply(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
