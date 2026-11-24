import { Platform, TextStyle } from 'react-native';

// Figma `KRDS / Semantic` 변수(기본 모드)를 그대로 옮긴 색. 이름도 Figma와 같게 둔다.
export const C = {
  'background/white': '#ffffff',
  'background/gray-subtler': '#f4f5f6',
  'background/gray-subtle': '#e6e8ea',
  'background/dim': 'rgba(0,0,0,0.6)',

  'surface/white': '#ffffff',
  'surface/gray-subtler': '#f4f5f6',
  'surface/gray-subtle': '#e6e8ea',
  'surface/primary-subtler': '#eef2f9',
  'surface/success-subtler': '#eaf6ec',
  'surface/warning-subtler': '#fff3db',
  'surface/danger-subtler': '#fdefec',
  'surface/information-subtler': '#e7f4fe',
  'surface/inverse': '#1e2124',
  'surface/secondary-subtler': '#eef2f7',

  'text/bolder': '#131416',
  'text/basic': '#1e2124',
  'text/subtle': '#464c53',
  'text/disabled': '#8a949e',
  'text/disabled-on': '#6d7882',
  'text/primary': '#305a9e',
  'text/success': '#267337',
  'text/warning': '#8a5c00',
  'text/danger': '#bd2c0f',
  'text/information': '#096ab3',
  'text/inverse': '#ffffff',
  'text/subtle-inverse': '#b1b8be',

  'icon/gray': '#33363d',
  'icon/gray-light': '#464c53',
  'icon/primary': '#4476c6',
  'icon/success': '#228738',
  'icon/warning': '#9e6a00',
  'icon/danger': '#de3412',
  'icon/information': '#0b78cb',
  'icon/disabled': '#8a949e',
  'icon/inverse': '#ffffff',

  'element/primary': '#4476c6',
  'element/primary-light': '#dde5f2',
  'element/primary-lighter': '#eef2f9',
  'element/gray-light': '#e6e8ea',
  'element/gray-lighter': '#f4f5f6',
  'element/success': '#228738',
  'element/success-lighter': '#eaf6ec',
  'element/warning': '#ffb114',
  'element/danger': '#de3412',
  'element/point': '#d63d4a',
  // 스플래시 배경 (color/primary/40)
  'color/primary/40': '#628bcf',
  // 입소패스 카드 머리 (color/primary/50)
  'color/primary/50': '#4476c6',
  // 담당자에게 보여 주는 남색 패스 카드. 버튼과 같은 예비군 파랑 스케일(primary 70·80)에서 가져온다.
  // 사용 불가 패스는 gray 70·80.
  'pass/navy': '#213e6e', // color/primary/70
  'pass/navy-deep': '#162947', // color/primary/80
  'pass/charcoal': '#464c53', // color/gray/70
  'pass/charcoal-deep': '#33363d', // color/gray/80
  'pass/accent': '#93b0df', // color/primary/30
  'pass/subtle': 'rgba(188,205,235,0.72)', // color/primary/20, 72%
  'pass/fill': 'rgba(255,255,255,0.08)',
  'pass/line': 'rgba(255,255,255,0.14)',

  'border/gray-light': '#cdd1d5',
  'border/gray': '#b1b8be',
  'border/gray-dark': '#58616a',
  'border/primary': '#4476c6',
  'border/primary-light': '#dde5f2',
  'border/success-light': '#d8eedd',
  'border/warning-light': '#ffe0a3',
  'border/danger': '#de3412',
  'border/danger-light': '#fcdfd9',
  'border/information-light': '#d3ebfd',
  'divider/gray-light': '#cdd1d5',

  'button/primary-fill': '#4476c6',
  'button/primary-fill-pressed': '#213e6e',
  'button/secondary-fill': '#eef2f9',
  'button/secondary-fill-pressed': '#bccdeb',
  'button/secondary-border': '#4476c6',
  'button/tertiary-border': '#58616a',
  'button/tertiary-fill-pressed': '#e6e8ea',
  'button/disabled-fill': '#cdd1d5',

  'input/border': '#58616a',
  'input/border-active': '#4476c6',
  'input/border-error': '#de3412',
  'input/surface-disabled': '#cdd1d5',

  'link/default': '#4476c6',
} as const;

export type ColorToken = keyof typeof C;

// KRDS / Number (Mobile)
export const gap = { 1: 2, 2: 4, 3: 8, 4: 12, 5: 16, 6: 20, 7: 24, 8: 32, 9: 40, 10: 48 } as const;
export const padding = { 1: 2, 2: 4, 3: 8, 4: 10, 5: 12, 6: 16, 7: 20, 8: 24, 9: 32, 10: 40 } as const;
export const radius = { xsmall: 2, small: 4, medium1: 6, medium3: 8, large: 10, xlarge: 12, max: 1000 } as const;

// 디자인 기준 폭(393). 태블릿·데스크톱 웹에서는 휴대폰 폭으로 가운데 정렬.
export const DESIGN_WIDTH = 393;
export const MAX_APP_WIDTH = 480;

export const Font = {
  regular: 'PretendardGOV-Regular',
  bold: 'PretendardGOV-Bold',
} as const;

// Figma 텍스트 스타일. 줄 간격은 모두 150%.
const styles = {
  'display/small': [28, 'bold'],
  'heading/large': [24, 'bold'],
  'heading/medium': [22, 'bold'],
  'heading/small': [19, 'bold'],
  'heading/xsmall': [17, 'bold'],
  'heading/xxsmall': [15, 'bold'],
  'body/large-bold': [19, 'bold'],
  'body/medium-bold': [17, 'bold'],
  'body/small-bold': [15, 'bold'],
  'body/xsmall-bold': [13, 'bold'],
  'body/large': [19, 'regular'],
  'body/medium': [17, 'regular'],
  'body/small': [15, 'regular'],
  'body/xsmall': [13, 'regular'],
  'navigation/title-small': [17, 'bold'],
} as const;

export type TextToken = keyof typeof styles;

export function type(token: TextToken): TextStyle {
  const [size, weight] = styles[token];
  return {
    fontFamily: Font[weight],
    fontSize: size,
    lineHeight: Math.round(size * 1.5),
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
  };
}
