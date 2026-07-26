// ============================================================
// 打印 / PDF 样式 — 单一事实来源
//
// 所有渲染路径（浏览器打印、PDF 生成）都从这里取样式值。
// 改一处，全局生效。
// ============================================================

import { A4_MM, DEFAULT_MARGIN, DEFAULT_USABLE_HEIGHT } from './types';

/** 页面容器 */
export const PAGE_STYLE = {
  width: `${A4_MM.width}mm`,
  height: `${A4_MM.height}mm`,
  padding: `${DEFAULT_MARGIN.top}mm ${DEFAULT_MARGIN.right}mm ${DEFAULT_MARGIN.bottom}mm ${DEFAULT_MARGIN.left}mm`,
  boxSizing: 'border-box',
} as const;

/** 内容区 */
export const CONTENT_STYLE = {
  width: `${A4_MM.width - DEFAULT_MARGIN.left - DEFAULT_MARGIN.right}mm`,
  height: `${DEFAULT_USABLE_HEIGHT}mm`,
  overflow: 'hidden',
} as const;

/** 页眉 */
export const HEADER_STYLE = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '0.5mm',
  fontSize: '7.5px',
  color: '#999',
  borderBottom: '0.5px solid #e0e0e0',
  paddingBottom: '0.5mm',
} as const;

/** 页脚 */
export const FOOTER_STYLE = {
  display: 'flex',
  justifyContent: 'center',
  marginTop: '0.5mm',
  borderTop: '0.5px solid #e0e0e0',
  fontSize: '13px',
  fontWeight: '700',
  color: '#333',
} as const;

/** 表格 */
export const TABLE_STYLE = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '10px',
  tableLayout: 'auto',
  marginBottom: '2mm',
} as const;

/** 表头单元格 */
export const TH_STYLE = {
  padding: '1mm 2mm',
  border: '0.5px solid #ddd',
  background: '#f5f5f5',
  fontWeight: '600',
  textAlign: 'left',
  fontSize: '10px',
} as const;

/** 数据单元格 */
export const TD_STYLE = {
  padding: '0.8mm 2mm',
  border: '0.5px solid #eee',
  fontSize: '10px',
} as const;

/** 文本块 */
export const TEXT_STYLE = {
  marginBottom: '2mm',
  fontSize: '12px',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap',
} as const;

/** 输入框 */
export const INPUT_TEXTAREA_STYLE = {
  width: '100%',
  padding: '1mm 2mm',
  border: '0.5px solid #ddd',
  borderRadius: '1px',
  fontSize: '10px',
  fontFamily: 'inherit',
  resize: 'none',
} as const;

/** 输入框标签 */
export const INPUT_LABEL_STYLE = {
  display: 'block',
  fontSize: '10px',
  color: '#666',
  marginBottom: '1mm',
} as const;

/** 图表容器 */
export const CHART_STYLE = {
  marginBottom: '2mm',
  width: '100%',
} as const;

/**
 * 将样式对象转为 CSS 字符串（用于注入 <style>）
 */
export function toCSSString(selector: string, style: Record<string, string>): string {
  const rules = Object.entries(style)
    .map(([key, val]) => {
      // camelCase → kebab-case
      const prop = key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
      return `  ${prop}:${val};`;
    })
    .join('\n');
  return `${selector} {\n${rules}\n}`;
}

/**
 * 生成完整的打印 CSS（供 demo 和 html-builder 使用）
 */
export function generatePrintCSS(): string {
  return [
    toCSSString('.a4-page', {
      ...PAGE_STYLE,
      background: '#fff',
      margin: '0 auto',
      boxShadow: 'none',
      pageBreakAfter: 'always',
      overflow: 'hidden',
    } as Record<string, string>),
    '.a4-page:last-child { page-break-after: auto; }',
    toCSSString('.a4-page-header', HEADER_STYLE as Record<string, string>),
    toCSSString('.a4-page-content', CONTENT_STYLE as Record<string, string>),
    toCSSString('.a4-page-footer', FOOTER_STYLE as Record<string, string>),
    toCSSString('.a4-block--table', { marginBottom: TABLE_STYLE.marginBottom } as Record<string, string>),
    toCSSString('.a4-block--table table', {
      width: TABLE_STYLE.width,
      borderCollapse: TABLE_STYLE.borderCollapse,
      fontSize: TABLE_STYLE.fontSize,
    } as Record<string, string>),
    toCSSString('.a4-block--table th', TH_STYLE as Record<string, string>),
    toCSSString('.a4-block--table td', TD_STYLE as Record<string, string>),
    toCSSString('.a4-block--table tr:nth-child(even) td', { background: '#fafafa' } as Record<string, string>),
    toCSSString('.a4-block--text', TEXT_STYLE as Record<string, string>),
    toCSSString('.a4-block--input', { marginBottom: '2mm' } as Record<string, string>),
    toCSSString('.a4-block--input textarea', INPUT_TEXTAREA_STYLE as Record<string, string>),
    toCSSString('.a4-block--input label', INPUT_LABEL_STYLE as Record<string, string>),
    toCSSString('.a4-block--chart', CHART_STYLE as Record<string, string>),
    toCSSString('.a4-block--chart .chart-container', {
      width: CHART_STYLE.width,
      background: '#fafafa',
      border: '0.5px solid #eee',
    } as Record<string, string>),
  ].join('\n');
}

/**
 * 生成"打印全部"CSS（带 #app 前缀提权 + !important）
 * 用于动态注入以覆盖默认的单页打印样式
 */
export function generatePrintAllCSS(): string {
  const base = generatePrintCSS();
  // 每条规则加 #app 前缀，每条属性加 !important
  return base
    .replace(/^(\.[\w-]+|\.a4-[\w-]+(?:\s+[.#\w-]+)*)\s*\{/gm, '#app $1 {')
    .replace(/:\s*([^;{}]+?)(;|\s*\})/g, ': $1 !important$2');
}
