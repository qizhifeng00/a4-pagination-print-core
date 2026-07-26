// ============================================================
// A4 物理尺寸常量
// ============================================================

/** A4 纸张尺寸（mm） */
export const A4_MM = {
  width: 210,
  height: 297,
} as const;

/** 默认页边距（mm） */
export const DEFAULT_MARGIN = {
  top: 5,
  bottom: 5,
  left: 8,
  right: 8,
} as const;

/** 页眉高度（日期，mm） */
export const PAGE_HEADER_HEIGHT = 3;

/** 页脚高度（页码信息，mm） */
export const PAGE_FOOTER_HEIGHT = 4;

/** 默认可用内容高度 = 297 - 5 - 5 - 3(页眉) - 4(页脚) = 280mm */
export const DEFAULT_USABLE_HEIGHT =
  A4_MM.height - DEFAULT_MARGIN.top - DEFAULT_MARGIN.bottom - PAGE_HEADER_HEIGHT - PAGE_FOOTER_HEIGHT;

/** 默认可用内容宽度 = 210 - 8 - 8 = 194mm */
export const DEFAULT_USABLE_WIDTH =
  A4_MM.width - DEFAULT_MARGIN.left - DEFAULT_MARGIN.right;

// ============================================================
// Block 类型系统
// ============================================================

/**
 * Block 是所有内容的基本单元。
 * 每个 Block 代表报表中的一个内容块（表格、图表、输入框、文本等）。
 */
export type BlockType = 'table' | 'input' | 'chart' | 'text' | 'custom';

export interface Block {
  /** 唯一标识 */
  id: string;
  /** Block 类型 */
  type: BlockType;
  /** 预估高度（mm） */
  height: number;
  /**
   * 是否允许跨页拆分。
   * - table: true（按行拆分）
   * - chart: false（整体移动）
   * - input: false
   * - text: true（按行拆分）
   */
  breakable: boolean;
  /** 原始数据（传给渲染器） */
  data?: unknown;
  /** 扩展元数据 */
  meta?: Record<string, unknown>;
}

// ============================================================
// 具体 Block 类型
// ============================================================

export interface TableColumn {
  key: string;
  title: string;
  width?: number; // mm，未指定则均分
}

export interface TableBlock extends Block {
  type: 'table';
  rows: Record<string, unknown>[];
  columns: TableColumn[];
  /** 每页行数（用于跨页拆分），不指定则按高度计算 */
  rowsPerPage?: number;
  /** 每行实际高度（mm），由 measureBlock 自动计算，用于精准分页 */
  rowHeights?: number[];
}

export interface ChartBlock extends Block {
  type: 'chart';
  /** ECharts option 对象 — 存配置而非实例 */
  option: Record<string, unknown>;
}

export interface InputBlock extends Block {
  type: 'input';
  value?: string;
  label?: string;
  placeholder?: string;
}

export interface TextBlock extends Block {
  type: 'text';
  content: string;
}

// ============================================================
// 页面 & 报表模型
// ============================================================

export interface Page {
  /** 日期 YYYY-MM-DD */
  date: string;
  /** 当天第几页，从 1 开始 */
  pageNumber: number;
  /** 该页包含的 Block 列表 */
  blocks: Block[];
}

export interface Report {
  title: string;
  pages: Page[];
}

// ============================================================
// 翻页状态
// ============================================================

export interface PageState {
  /** 当前日期在 dates 数组中的索引 */
  dateIndex: number;
  /** 当前日期内的页码（0-based，方便取 pages[pageIndex]） */
  pageIndex: number;
}

// ============================================================
// 日期分组（输入侧）
// ============================================================

export interface DateGroup {
  date: string; // YYYY-MM-DD
  blocks: Block[];
}

// ============================================================
// 分页配置
// ============================================================

export interface PaginatorConfig {
  /** 每页可用高度（mm），默认 DEFAULT_USABLE_HEIGHT (280) */
  pageHeight?: number;
  /** 新日期是否强制起新页，默认 true */
  newDateNewPage?: boolean;
  /** 自定义测量策略，不传使用内置实现 */
  measureStrategy?: MeasureStrategy;
}

// ============================================================
// 测量策略 — 可插拔
// ============================================================

export interface MeasureStrategy {
  /** 测量单个 Block，返回带 height 的新 Block */
  measureBlock(block: Block): Block;
  /** 批量测量 */
  measureBlocks(blocks: Block[]): Block[];
}

// ============================================================
// 分页结果元数据
// ============================================================

export interface PaginationMeta {
  totalPages: number;
  dates: string[];
  /** 每个日期有多少页 */
  pagesPerDate: Record<string, number>;
}
