// ============================================================
// @a4-pagination-print/core — A4 Pagination Engine
// ============================================================

// Types
export type {
  BlockType,
  Block,
  TableColumn,
  TableBlock,
  ChartBlock,
  InputBlock,
  TextBlock,
  Page,
  Report,
  PageState,
  DateGroup,
  PaginatorConfig,
  PaginationMeta,
  MeasureStrategy,
} from './types';

export {
  A4_MM,
  DEFAULT_MARGIN,
  PAGE_HEADER_HEIGHT,
  PAGE_FOOTER_HEIGHT,
  DEFAULT_USABLE_HEIGHT,
  DEFAULT_USABLE_WIDTH,
} from './types';

// Paginator
export { paginate, flattenPages } from './paginator';
export type { FlattenedBlock } from './paginator';

// Date Paginator
export {
  datePaginate,
  getPaginationMeta,
  getDateStartPageIndex,
  getDatePageCount,
} from './date-paginator';
export type { DatePaginationMeta } from './date-paginator';

// Measure
export {
  measureTableHeight,
  measureChartHeight,
  measureInputHeight,
  measureTextHeight,
  measureBlock,
  measureBlocks,
} from './measure';

// Page Navigator
export { PageNavigator } from './page-navigator';
export type { NavigationDirection, NavigationResult } from './page-navigator';

// Print Styles
export {
  PAGE_STYLE,
  CONTENT_STYLE,
  HEADER_STYLE,
  FOOTER_STYLE,
  TABLE_STYLE,
  TH_STYLE,
  TD_STYLE,
  TEXT_STYLE,
  INPUT_TEXTAREA_STYLE,
  INPUT_LABEL_STYLE,
  CHART_STYLE,
  toCSSString,
  generatePrintCSS,
  generatePrintAllCSS,
} from './print-styles';
