import type { Block, TableBlock } from './types';
import { DEFAULT_USABLE_HEIGHT } from './types';

// ============================================================
// 核心分页算法 — 高度累积法
// ============================================================

/** 底部安全边距（mm）— 避免行刚好卡在边界被截断 */
const BOTTOM_SAFETY = 2;

/**
 * 对 Block 列表进行分页。
 *
 * 算法：
 * 1. 遍历 blocks，累积高度
 * 2. 当前页放不下时（累积高度 + 当前 block 高度 > pageHeight）：
 *    - 如果 block.breakable=true（如表格），尝试按行拆分，剩余行放到新页
 *    - 如果 block.breakable=false（如图表），整体移到下一页
 * 3. 最后一页可能有剩余空间
 *
 * @param blocks - 已测量高度的 Block 列表
 * @param pageHeight - 每页可用高度（mm），默认 277mm
 * @returns 分页后的 Block 二维数组（每项是一页的 blocks）
 */
export function paginate(
  blocks: Block[],
  pageHeight: number = DEFAULT_USABLE_HEIGHT
): Block[][] {
  if (blocks.length === 0) return [];

  const pages: Block[][] = [];
  let currentPage: Block[] = [];
  let currentHeight = 0;

  for (const block of blocks) {
    const blockFits = currentHeight + block.height <= pageHeight - BOTTOM_SAFETY;

    if (blockFits) {
      currentPage.push(block);
      currentHeight += block.height;
    } else if (block.breakable && block.type === 'table') {
      // 可拆分的表格：可能跨多页，循环拆到全部行入页
      let tableToSplit = block as TableBlock;
      let curH = currentHeight;
      let curPage = currentPage;

      while (true) {
        const result = splitTableAcrossPages(
          tableToSplit,
          curH,
          pageHeight,
          curPage
        );
        pages.push(result.filledPage);

        const remainingBlock = result.remainingPage[0];
        if (!remainingBlock || remainingBlock.type !== 'table') {
          // 无剩余行
          currentPage = result.remainingPage;
          currentHeight = result.remainingHeight;
          break;
        }

        const remainingTable = remainingBlock as TableBlock;
        if (result.remainingHeight <= pageHeight) {
          // 剩余行能放进一页，留作当前页继续放后续 block
          currentPage = result.remainingPage;
          currentHeight = result.remainingHeight;
          break;
        }

        // 剩余行仍放不下 → 新一轮拆分（表头从头开始）
        tableToSplit = remainingTable;
        curH = 0;
        curPage = [];
      }
    } else {
      // 放不下且不可拆分：整体移到下一页
      if (currentPage.length > 0) {
        pages.push(currentPage);
      }
      currentPage = [block];
      currentHeight = block.height;
    }
  }

  // 最后一页
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

/**
 * 表格跨页拆分结果
 */
interface TableSplitResult {
  /** 填满的当前页 */
  filledPage: Block[];
  /** 剩余行组成的新页开头 */
  remainingPage: Block[];
  /** 剩余页的累计高度 */
  remainingHeight: number;
}

/**
 * 将表格按行拆分到两页
 *
 * 策略：
 * 1. 先计算当前页还能放多少行（含表头）
 * 2. 第一部分：表头 + 能放下的行 → 放到当前页
 * 3. 第二部分：表头 + 剩余行 → 放到下一页
 */
function splitTableAcrossPages(
  table: TableBlock,
  currentHeight: number,
  pageHeight: number,
  currentPage: Block[]
): TableSplitResult {
  const rows = table.rows;
  const rowHeights = table.rowHeights;
  const HEADER_HEIGHT = 10;

  // 获取第 i 行的高度
  function getRowHeight(i: number): number {
    if (rowHeights && i < rowHeights.length) return rowHeights[i];
    // 回退：固定行高
    return table.rowsPerPage
      ? (pageHeight - HEADER_HEIGHT) / table.rowsPerPage
      : 8;
  }

  // 当前页剩余空间
  const remainingSpace = pageHeight - currentHeight;

  // 数据行可用空间（减去表头 + 安全边距）
  const dataSpace = remainingSpace - HEADER_HEIGHT - BOTTOM_SAFETY;

  if (dataSpace <= 0) {
    // 连表头都放不下，整体移到下一页
    return {
      filledPage: [...currentPage],
      remainingPage: [table],
      remainingHeight: table.height,
    };
  }

  // 逐行累加高度，找到能放下的最大行数
  let accumulated = 0;
  let firstPageRowCount = 0;
  for (let i = 0; i < rows.length; i++) {
    const rh = getRowHeight(i);
    if (accumulated + rh <= dataSpace) {
      accumulated += rh;
      firstPageRowCount++;
    } else {
      break;
    }
  }

  if (firstPageRowCount === 0) {
    return {
      filledPage: [...currentPage],
      remainingPage: [table],
      remainingHeight: table.height,
    };
  }

  // 第一部分：表头 + 能放下的行
  const firstPartRows = rows.slice(0, firstPageRowCount).map((r: any) => ({ ...r, _rowspan: r._rowspan ? { ...r._rowspan } : undefined }));
  const remainingRows = rows.slice(firstPageRowCount).map((r: any) => ({ ...r, _rowspan: r._rowspan ? { ...r._rowspan } : undefined }));

  // ---- rowspan 跨页拆分：上下两段各自带合并，内容不丢 ----
  for (let i = 0; i < firstPageRowCount; i++) {
    const origSpan = (rows[i] as any)?._rowspan as Record<string, number> | undefined;
    if (!origSpan) continue;

    for (const [colKey, span] of Object.entries(origSpan)) {
      const endRow = i + span;
      if (endRow <= firstPageRowCount) continue; // 完整包含，不处理

      // 上段：缩减 rowspan
      const rowsOnPage1 = firstPageRowCount - i;
      if (rowsOnPage1 <= 0) {
        // 这一行本身放不下，整体到下一页（理论上不会，因为 firstPageRowCount 至少包含此行）
        delete firstPartRows[i]._rowspan![colKey];
      } else {
        firstPartRows[i]._rowspan![colKey] = rowsOnPage1;
      }

      // 下段：首行重复内容 + 新 rowspan
      const remainingSpan = span - rowsOnPage1;
      if (remainingSpan > 0 && remainingRows.length > 0) {
        // 把被合并列的原始值复制到下段首行
        remainingRows[0][colKey] = (rows[i] as any)[colKey];
        if (!remainingRows[0]._rowspan) remainingRows[0]._rowspan = {};
        remainingRows[0]._rowspan[colKey] = remainingSpan;
      }
    }
  }

  // 重新计算上段高度
  let firstPartHeight = HEADER_HEIGHT;
  for (let j = 0; j < firstPageRowCount; j++) {
    firstPartHeight += getRowHeight(j);
  }

  const firstPart: TableBlock = {
    ...table,
    id: `${table.id}__p1`,
    rows: firstPartRows,
    height: firstPartHeight,
    rowHeights: rowHeights?.slice(0, firstPageRowCount),
  };

  // 下段高度
  const remainingHeights = rowHeights?.slice(firstPageRowCount);
  const remainingTotalHeight = remainingHeights
    ? remainingHeights.reduce((s, h) => s + h, 0)
    : remainingRows.length * getRowHeight(0);

  const secondPart: TableBlock = {
    ...table,
    id: `${table.id}__p2`,
    rows: remainingRows,
    height: HEADER_HEIGHT + remainingTotalHeight,
    rowHeights: remainingHeights,
  };

  return {
    filledPage: [...currentPage, firstPart],
    remainingPage: [secondPart],
    remainingHeight: secondPart.height,
  };
}

/**
 * 获取分页后的扁平 Block 列表（带页码标记）
 */
export interface FlattenedBlock extends Block {
  /** 所在页码（0-based） */
  pageIndex: number;
}

export function flattenPages(pages: Block[][]): FlattenedBlock[] {
  const result: FlattenedBlock[] = [];
  for (let i = 0; i < pages.length; i++) {
    for (const block of pages[i]) {
      result.push({ ...block, pageIndex: i });
    }
  }
  return result;
}
