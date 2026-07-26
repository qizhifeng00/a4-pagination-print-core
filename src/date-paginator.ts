import type { Block, Page, DateGroup, PaginatorConfig } from './types';
import { DEFAULT_USABLE_HEIGHT } from './types';
import { paginate } from './paginator';
import { measureBlocks as defaultMeasureBlocks } from './measure';

// ============================================================
// 日期感知分页器
// ============================================================

/**
 * 按日期分组进行分页。
 *
 * 每个日期独立分页，页码从 1 重新开始。
 * 日期之间可选择是否强制起新页（默认 true）。
 *
 * @param groups - 按日期分组的 Block 数据
 * @param config - 分页配置
 * @returns 带日期 + 页码标记的 Page 数组
 *
 * @example
 * ```ts
 * const pages = datePaginate([
 *   { date: '2026-07-24', blocks: [...] },
 *   { date: '2026-07-25', blocks: [...] },
 * ]);
 * // pages = [
 * //   { date: '2026-07-24', pageNumber: 1, blocks: [...] },
 * //   { date: '2026-07-24', pageNumber: 2, blocks: [...] },
 * //   { date: '2026-07-25', pageNumber: 1, blocks: [...] },
 * // ]
 * ```
 */
export function datePaginate(
  groups: DateGroup[],
  config: PaginatorConfig = {}
): Page[] {
  const {
    pageHeight = DEFAULT_USABLE_HEIGHT,
    newDateNewPage = true,
    measureStrategy,
  } = config;

  const measureBlocksFn = measureStrategy?.measureBlocks ?? defaultMeasureBlocks;

  const allPages: Page[] = [];

  for (const group of groups) {
    // 浅拷贝 blocks 数组，保证原始数据不被分页过程修改
    const clonedBlocks = group.blocks.map((b) => ({ ...b }));
    const measuredBlocks = measureBlocksFn(clonedBlocks);

    // 对该日期的 blocks 进行分页
    const pageBlocksList = paginate(measuredBlocks, pageHeight);

    // 转换为 Page 对象
    const datePages: Page[] = pageBlocksList.map((blocks, index) => ({
      date: group.date,
      pageNumber: index + 1,
      blocks,
    }));

    // 如果 newDateNewPage 且上一个日期的最后一页不满，已经通过 paginate 自然处理
    // （因为每个日期独立调用 paginate，自然从新页开始）
    // 但如果需要强制前一日期最后补空白，在此处理
    if (newDateNewPage && allPages.length > 0) {
      // paginate 已经保证每个 group 重新开始分页
      // 不需要额外处理
    }

    allPages.push(...datePages);
  }

  return allPages;
}

/**
 * 从 Page 数组提取翻页元数据
 */
export interface DatePaginationMeta {
  /** 总页数 */
  totalPages: number;
  /** 所有日期列表（去重） */
  dates: string[];
  /** 每个日期的页数 */
  pagesPerDate: Record<string, number>;
  /** 每页的全局索引映射 */
  pageIndexMap: Array<{ date: string; pageNumber: number }>;
}

export function getPaginationMeta(pages: Page[]): DatePaginationMeta {
  const datesSet = new Set<string>();
  const pagesPerDate: Record<string, number> = {};
  const pageIndexMap: Array<{ date: string; pageNumber: number }> = [];

  for (const page of pages) {
    datesSet.add(page.date);
    pagesPerDate[page.date] = (pagesPerDate[page.date] || 0) + 1;
    pageIndexMap.push({ date: page.date, pageNumber: page.pageNumber });
  }

  return {
    totalPages: pages.length,
    dates: Array.from(datesSet),
    pagesPerDate,
    pageIndexMap,
  };
}

/**
 * 计算指定日期的起始全局页码（0-based）
 */
export function getDateStartPageIndex(pages: Page[], date: string): number {
  return pages.findIndex((p) => p.date === date);
}

/**
 * 计算指定日期的页数
 */
export function getDatePageCount(pages: Page[], date: string): number {
  return pages.filter((p) => p.date === date).length;
}
