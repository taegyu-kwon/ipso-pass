// 화면에 보일 때 가운데 자리를 가린다.
//  010-0000-0001 → 010-****-0001, 000-000000-0001 → 000-******-0001, 21-00000001 → 21-0000****
export function mask(v: string) {
  const p = v.split('-');
  if (p.length >= 3) return [p[0], ...p.slice(1, -1).map((s) => '*'.repeat(s.length)), p[p.length - 1]].join('-');
  return v.slice(0, -4) + '****';
}
