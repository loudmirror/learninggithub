/**
 * Design System Constants
 * 统一的设计规范 - 颜色、间距、阴影、字体
 */

/**
 * 颜色系统
 */
export const THEME_COLORS = {
  primary: {
    main: '#1890ff',
    light: '#e6f7ff',
    dark: '#096dd9',
  },
  success: {
    main: '#52c41a',
    light: '#f6ffed',
    dark: '#389e0d',
  },
  warning: {
    main: '#faad14',
    light: '#fffbe6',
    dark: '#d48806',
  },
  neutral: {
    bg: '#f0f2f5',
    bgLight: '#fafafa',
    bgBase: '#ffffff',
    border: '#d9d9d9',
    borderLight: '#f0f0f0',
    text: {
      primary: '#262626',
      secondary: '#595959',
      disabled: '#bfbfbf',
    },
  },
} as const;

/**
 * 间距系统
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/**
 * 圆角规范
 */
export const BORDER_RADIUS = {
  sm: 2,
  md: 4,
  lg: 8,
} as const;

/**
 * 阴影规范
 */
export const BOX_SHADOW = {
  sm: '0 2px 4px rgba(0, 0, 0, 0.06)',
  md: '0 4px 8px rgba(0, 0, 0, 0.08)',
  lg: '0 8px 16px rgba(0, 0, 0, 0.12)',
} as const;

/**
 * 字体层级
 */
export const TYPOGRAPHY = {
  h1: { size: 24, weight: 600, lineHeight: 1.4 },
  h2: { size: 20, weight: 600, lineHeight: 1.4 },
  h3: { size: 16, weight: 600, lineHeight: 1.5 },
  body: { size: 14, weight: 400, lineHeight: 1.6 },
  caption: { size: 12, weight: 400, lineHeight: 1.5 },
} as const;

/**
 * 过渡动画
 */
export const TRANSITIONS = {
  fast: '0.15s ease',
  normal: '0.3s ease',
  slow: '0.45s ease',
} as const;
