import type { Block, TableBlock, ChartBlock, InputBlock, TextBlock } from './types';
import { DEFAULT_USABLE_WIDTH } from './types';

// ============================================================
// 高度测量工具（mm）
// ============================================================

/** 默认表格行高（mm） */
const DEFAULT_ROW_HEIGHT = 8;

/** 默认表头高度（mm） */
const DEFAULT_HEADER_HEIGHT = 10;

/** 默认图表高度（mm） */
const DEFAULT_CHART_HEIGHT = 100;

/** 默认输入框高度（mm） */
const DEFAULT_INPUT_HEIGHT = 20;

/** 表格字体（mm）— 10px ≈ 2.65mm */
const TABLE_FONT_SIZE_MM = 2.65;
/** 表格行高倍数 */
const TABLE_LINE_HEIGHT = 1.4;
/** 文本块字体（mm）— 12px ≈ 3.18mm */
const TEXT_FONT_SIZE_MM = 3.18;
/** 文本行高倍数 */
const TEXT_LINE_HEIGHT = 1.6;
/** 单元格左右 padding 合计（mm），th/td 各约 2mm*2=4mm */
const CELL_PADDING_H = 4;

/**
 * 估算表格高度（简化版，按固定行高）
 */
export function measureTableHeight(
  rowCount: number,
  rowHeight: number = DEFAULT_ROW_HEIGHT,
  hasHeader: boolean = true
): number {
  const headerHeight = hasHeader ? DEFAULT_HEADER_HEIGHT : 0;
  return headerHeight + rowCount * rowHeight;
}

/**
 * 根据单元格内容计算表格每一行的实际高度
 *
 * 对每行取内容最长的单元格，估算换行后的高度。
 *
 * @param table - 表格 Block
 * @param availableWidth - 可用宽度（mm），默认 DEFAULT_USABLE_WIDTH
 * @returns 更新了 height 和 rowHeights 的 TableBlock 副本
 */
export function measureTableByContent(
  table: TableBlock,
  availableWidth: number = DEFAULT_USABLE_WIDTH
): TableBlock {
  const cols = table.columns;
  const colCount = cols.length;

  // ---- 列宽估算：按内容比例分配（模拟 table-layout: auto） ----
  const specifiedWidth = cols.reduce((sum, c) => sum + (c.width || 0), 0);
  const autoCols = cols.filter((c) => !c.width);
  const autoCount = autoCols.length;
  const remainingForAuto = availableWidth - specifiedWidth;

  // 计算每列的最大内容长度（字符数）
  const maxContentLen = cols.map((col, i) => {
    if (col.width) return -1; // 固定宽度的列不参与
    let maxLen = col.title.length;
    for (const row of table.rows) {
      const len = String(row[col.key] ?? '').length;
      if (len > maxLen) maxLen = len;
    }
    return maxLen;
  });

  const totalLen = maxContentLen.reduce((sum, l) => sum + (l > 0 ? l : 0), 0) || 1;
  const minColWidth = 18; // 每列最低 18mm

  // 按内容长度比例分配宽度，保证最低宽度
  let allocated = specifiedWidth;
  const autoWidths: number[] = [];
  for (let i = 0; i < cols.length; i++) {
    if (cols[i].width) {
      autoWidths.push(cols[i].width!);
      continue;
    }
    const ratio = maxContentLen[i] / totalLen;
    const w = Math.max(minColWidth, ratio * remainingForAuto);
    autoWidths.push(w);
    allocated += w;
  }

  // 如果总宽度超过 availableWidth，按比例缩放
  const colWidths =
    allocated > availableWidth
      ? autoWidths.map((w) => (w / allocated) * availableWidth)
      : autoWidths;

  // ---- 逐行计算高度 ----
  const rowHeights: number[] = [];
  let totalRowHeight = 0;

  for (const row of table.rows) {
    let maxLines = 1;
    for (let i = 0; i < cols.length; i++) {
      const cellContent = String(row[cols[i].key] ?? '');
      const textWidth = Math.max(1, colWidths[i] - CELL_PADDING_H);
      const lines = measureTextLines(
        cellContent,
        TABLE_FONT_SIZE_MM,
        TABLE_LINE_HEIGHT,
        textWidth
      );
      maxLines = Math.max(maxLines, lines);
    }
    const h = maxLines * TABLE_FONT_SIZE_MM * TABLE_LINE_HEIGHT;
    rowHeights.push(h);
    totalRowHeight += h;
  }

  return {
    ...table,
    rowHeights,
    height: DEFAULT_HEADER_HEIGHT + totalRowHeight,
  };
}

/**
 * 计算文本在指定宽度下会折成多少行
 */
function measureTextLines(
  content: string,
  fontSize: number = TABLE_FONT_SIZE_MM,
  lineHeightRatio: number = TABLE_LINE_HEIGHT,
  availableWidth: number = DEFAULT_USABLE_WIDTH
): number {
  if (!content) return 1;

  const avgCharWidth = fontSize * 0.75;
  const charsPerLine = Math.max(1, Math.floor(availableWidth / avgCharWidth));

  return content
    .split('\n')
    .reduce((total, paragraph) => {
      return total + Math.max(1, Math.ceil(paragraph.length / charsPerLine));
    }, 0);
}

/**
 * 估算 ECharts 图表高度
 * @param height 指定高度（mm），默认 100mm
 */
export function measureChartHeight(height: number = DEFAULT_CHART_HEIGHT): number {
  return height;
}

/**
 * 估算输入框高度
 * @param lines 行数，默认 1
 */
export function measureInputHeight(lines: number = 1): number {
  return lines * DEFAULT_INPUT_HEIGHT;
}

/**
 * 估算文本块高度
 * @param content 文本内容
 * @param fontSize 字体大小（mm），默认 3.5mm ≈ 10pt
 * @param lineHeightRatio 行高倍数，默认 1.5
 * @param availableWidth 可用宽度（mm），默认 180mm
 */
export function measureTextHeight(
  content: string,
  fontSize: number = TEXT_FONT_SIZE_MM,
  lineHeightRatio: number = TEXT_LINE_HEIGHT,
  availableWidth: number = DEFAULT_USABLE_WIDTH
): number {
  if (!content) return 0;
  const lines = measureTextLines(content, fontSize, lineHeightRatio, availableWidth);
  return lines * fontSize * lineHeightRatio;
}

/**
 * 自动测量 Block 并返回设置了 height 的新 Block
 * 对于 TableBlock，同时计算 rowHeights
 */
export function measureBlock(block: Block): Block {
  if (block.height > 0) return block;

  switch (block.type) {
    case 'table': {
      const t = block as TableBlock;
      if (t.rowsPerPage) {
        return {
          ...t,
          height: measureTableHeight(t.rows.length),
        };
      }
      return measureTableByContent(t);
    }
    case 'chart':
      return {
        ...block,
        height: measureChartHeight(((block as ChartBlock).option as any)?.height),
      };
    case 'input':
      return {
        ...block,
        height: measureInputHeight(
          (block as InputBlock).value ? (block as InputBlock).value!.split('\n').length : 1
        ),
      };
    case 'text':
      return {
        ...block,
        height: measureTextHeight((block as TextBlock).content),
      };
    default:
      return { ...block, height: block.height || DEFAULT_INPUT_HEIGHT };
  }
}

/**
 * 批量测量 Block 高度并更新 height 字段
 * 返回新的 blocks 数组，每个 block 的 height 已被设置
 */
export function measureBlocks(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    if (block.height > 0 && block.type !== 'table') return block;
    // 表格即使 height=0（表示"自动测量"）也走完整测量以获取 rowHeights
    return measureBlock(block);
  });
}
