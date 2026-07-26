import type { Page, PageState } from './types';
import { getPaginationMeta } from './date-paginator';

// ============================================================
// 页面导航器 — 纯逻辑，无 DOM 依赖
// ============================================================

/**
 * 导航事件
 */
export type NavigationDirection = 'next' | 'prev';

export interface NavigationResult {
  /** 是否成功翻页 */
  success: boolean;
  /** 全局页码（0-based） */
  globalIndex: number;
  /** 当前日期 */
  date: string;
  /** 当天页码（1-based） */
  pageNumber: number;
  /** 是否到了边界 */
  atStart: boolean;
  atEnd: boolean;
}

/**
 * 页面导航器
 *
 * 维护当前翻页状态，处理上一页/下一页/日期跳转逻辑。
 *
 * @example
 * ```ts
 * const nav = new PageNavigator(pages);
 * nav.next();   // → NavigationResult
 * nav.prev();
 * nav.goToDate('2026-07-25');
 * nav.goTo(5);  // 跳转到全局第 5 页
 * ```
 */
export class PageNavigator {
  private pages: Page[];
  private meta: ReturnType<typeof getPaginationMeta>;
  private state: PageState;

  constructor(pages: Page[]) {
    this.pages = pages;
    this.meta = getPaginationMeta(pages);
    this.state = { dateIndex: 0, pageIndex: 0 };
  }

  /**
   * 获取当前全局页码（0-based）
   */
  get currentGlobalIndex(): number {
    let offset = 0;
    const currentDate = this.meta.dates[this.state.dateIndex];
    if (!currentDate) return 0;

    // 累加前面日期的页数
    for (const date of this.meta.dates) {
      if (date === currentDate) break;
      offset += this.meta.pagesPerDate[date] || 0;
    }
    return offset + this.state.pageIndex;
  }

  /**
   * 获取当前状态
   */
  getCurrentState(): NavigationResult {
    const currentDate = this.meta.dates[this.state.dateIndex] || '';
    const currentPageNumber = this.state.pageIndex + 1;
    const globalIndex = this.currentGlobalIndex;

    return {
      success: true,
      globalIndex,
      date: currentDate,
      pageNumber: currentPageNumber,
      atStart: this.state.dateIndex === 0 && this.state.pageIndex === 0,
      atEnd:
        this.state.dateIndex === this.meta.dates.length - 1 &&
        this.state.pageIndex >=
          (this.meta.pagesPerDate[currentDate] || 1) - 1,
    };
  }

  /**
   * 下一页
   */
  next(): NavigationResult {
    const currentDate = this.meta.dates[this.state.dateIndex];
    const maxPageIndex = (this.meta.pagesPerDate[currentDate] || 1) - 1;

    if (this.state.pageIndex < maxPageIndex) {
      // 同一日期内下一页
      this.state.pageIndex++;
    } else if (this.state.dateIndex < this.meta.dates.length - 1) {
      // 跨日期：进入下一个日期的第一页
      this.state.dateIndex++;
      this.state.pageIndex = 0;
    } else {
      // 已到最后一页
      return { ...this.getCurrentState(), success: false };
    }

    return this.getCurrentState();
  }

  /**
   * 上一页
   */
  prev(): NavigationResult {
    if (this.state.pageIndex > 0) {
      // 同一日期内上一页
      this.state.pageIndex--;
    } else if (this.state.dateIndex > 0) {
      // 跨日期：进入上一个日期的最后一页
      this.state.dateIndex--;
      const prevDate = this.meta.dates[this.state.dateIndex];
      this.state.pageIndex = (this.meta.pagesPerDate[prevDate] || 1) - 1;
    } else {
      // 已到第一页
      return { ...this.getCurrentState(), success: false };
    }

    return this.getCurrentState();
  }

  /**
   * 跳转到指定日期的第一页
   */
  goToDate(date: string): NavigationResult {
    const dateIdx = this.meta.dates.indexOf(date);
    if (dateIdx === -1) {
      return { ...this.getCurrentState(), success: false };
    }
    this.state.dateIndex = dateIdx;
    this.state.pageIndex = 0;
    return this.getCurrentState();
  }

  /**
   * 跳转到全局第 N 页（0-based）
   */
  goTo(globalIndex: number): NavigationResult {
    if (globalIndex < 0 || globalIndex >= this.meta.totalPages) {
      return { ...this.getCurrentState(), success: false };
    }

    let remaining = globalIndex;
    for (let i = 0; i < this.meta.dates.length; i++) {
      const date = this.meta.dates[i];
      const pageCount = this.meta.pagesPerDate[date] || 0;
      if (remaining < pageCount) {
        this.state.dateIndex = i;
        this.state.pageIndex = remaining;
        return this.getCurrentState();
      }
      remaining -= pageCount;
    }

    return { ...this.getCurrentState(), success: false };
  }

  /**
   * 获取总页数
   */
  get totalPages(): number {
    return this.meta.totalPages;
  }

  /**
   * 获取所有日期
   */
  get dates(): string[] {
    return [...this.meta.dates];
  }
}
