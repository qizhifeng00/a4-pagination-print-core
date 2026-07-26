import { describe, it, expect } from 'vitest';
import { datePaginate, getPaginationMeta, getDateStartPageIndex, getDatePageCount } from '../date-paginator';
import type { Block, DateGroup, TableBlock, InputBlock } from '../types';

function makeBlock(overrides: Partial<Block> & { id: string }): Block {
  return {
    type: 'text',
    height: 20,
    breakable: false,
    ...overrides,
  };
}

function makeTable(id: string, rowCount: number, height = 100): TableBlock {
  return {
    id,
    type: 'table',
    height,
    breakable: true,
    rows: Array.from({ length: rowCount }, (_, i) => ({ index: i, name: `Row ${i}` })),
    columns: [
      { key: 'index', title: '序号' },
      { key: 'name', title: '名称' },
    ],
  };
}

describe('datePaginate', () => {
  const pageHeight = 277;

  it('should paginate a single date group', () => {
    const groups: DateGroup[] = [
      {
        date: '2026-07-25',
        blocks: [
          makeBlock({ id: '1', height: 100 }),
          makeBlock({ id: '2', height: 100 }),
          makeBlock({ id: '3', height: 100 }),
        ],
      },
    ];

    const pages = datePaginate(groups, { pageHeight });

    expect(pages.length).toBeGreaterThan(0);
    // 所有页的日期都应该是 '2026-07-25'
    for (const page of pages) {
      expect(page.date).toBe('2026-07-25');
    }
  });

  it('should reset pageNumber for each date', () => {
    const groups: DateGroup[] = [
      {
        date: '2026-07-24',
        blocks: [
          makeBlock({ id: 'a1', height: 200 }),
          makeBlock({ id: 'a2', height: 200 }),
        ],
      },
      {
        date: '2026-07-25',
        blocks: [
          makeBlock({ id: 'b1', height: 100 }),
        ],
      },
    ];

    const pages = datePaginate(groups, { pageHeight });

    // 2026-07-24: 至少1页（可能2页因为200+200=400>277）
    const july24Pages = pages.filter((p) => p.date === '2026-07-24');
    const july25Pages = pages.filter((p) => p.date === '2026-07-25');

    // 每个日期的页码应从 1 开始
    expect(july25Pages[0].pageNumber).toBe(1);

    // 2026-07-24 的页码应 >= 1
    expect(july24Pages.length).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < july24Pages.length; i++) {
      expect(july24Pages[i].pageNumber).toBe(i + 1);
    }
  });

  it('should handle multiple dates with many blocks', () => {
    const groups: DateGroup[] = [
      {
        date: '2026-07-24',
        blocks: Array.from({ length: 10 }, (_, i) =>
          makeBlock({ id: `a${i}`, height: 30 })
        ),
      },
      {
        date: '2026-07-25',
        blocks: Array.from({ length: 5 }, (_, i) =>
          makeBlock({ id: `b${i}`, height: 50 })
        ),
      },
      {
        date: '2026-07-26',
        blocks: Array.from({ length: 15 }, (_, i) =>
          makeBlock({ id: `c${i}`, height: 20 })
        ),
      },
    ];

    const pages = datePaginate(groups, { pageHeight });
    const meta = getPaginationMeta(pages);

    // 验证所有三个日期都存在
    expect(meta.dates).toContain('2026-07-24');
    expect(meta.dates).toContain('2026-07-25');
    expect(meta.dates).toContain('2026-07-26');

    // 总页数应该合理
    expect(meta.totalPages).toBeGreaterThan(0);

    // 每个日期至少有一页
    for (const date of meta.dates) {
      expect(meta.pagesPerDate[date]).toBeGreaterThanOrEqual(1);
    }
  });

  it('should return empty array for empty groups', () => {
    expect(datePaginate([])).toEqual([]);
  });

  it('should preserve block data through pagination', () => {
    const groups: DateGroup[] = [
      {
        date: '2026-07-25',
        blocks: [
          {
            id: 'input-1',
            type: 'input',
            height: 20,
            breakable: false,
            value: 'test value',
            label: 'Test Label',
          } as InputBlock,
        ],
      },
    ];

    const pages = datePaginate(groups, { pageHeight });
    expect(pages).toHaveLength(1);
    const block = pages[0].blocks[0];
    expect(block.id).toBe('input-1');
    expect(block.type).toBe('input');
  });
});

describe('getPaginationMeta', () => {
  it('should compute correct metadata', () => {
    const pages = [
      { date: '2026-07-24', pageNumber: 1, blocks: [] },
      { date: '2026-07-24', pageNumber: 2, blocks: [] },
      { date: '2026-07-25', pageNumber: 1, blocks: [] },
    ];

    const meta = getPaginationMeta(pages);
    expect(meta.totalPages).toBe(3);
    expect(meta.dates).toEqual(['2026-07-24', '2026-07-25']);
    expect(meta.pagesPerDate).toEqual({
      '2026-07-24': 2,
      '2026-07-25': 1,
    });
  });
});

describe('getDateStartPageIndex', () => {
  it('should find first page index for a date', () => {
    const pages = [
      { date: '2026-07-24', pageNumber: 1, blocks: [] },
      { date: '2026-07-24', pageNumber: 2, blocks: [] },
      { date: '2026-07-25', pageNumber: 1, blocks: [] },
    ];

    expect(getDateStartPageIndex(pages, '2026-07-24')).toBe(0);
    expect(getDateStartPageIndex(pages, '2026-07-25')).toBe(2);
    expect(getDateStartPageIndex(pages, '2026-07-26')).toBe(-1);
  });
});

describe('getDatePageCount', () => {
  it('should count pages for a date', () => {
    const pages = [
      { date: '2026-07-24', pageNumber: 1, blocks: [] },
      { date: '2026-07-24', pageNumber: 2, blocks: [] },
      { date: '2026-07-25', pageNumber: 1, blocks: [] },
    ];

    expect(getDatePageCount(pages, '2026-07-24')).toBe(2);
    expect(getDatePageCount(pages, '2026-07-25')).toBe(1);
    expect(getDatePageCount(pages, '2026-07-26')).toBe(0);
  });
});
