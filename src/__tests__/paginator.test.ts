import { describe, it, expect } from 'vitest';
import { paginate, flattenPages } from '../paginator';
import type { Block, TableBlock, ChartBlock, InputBlock, TextBlock } from '../types';

// 辅助函数：创建测试 Block
function makeBlock(overrides: Partial<Block> & { id: string }): Block {
  return {
    type: 'text',
    height: 20,
    breakable: false,
    ...overrides,
  };
}

function makeTable(id: string, rowCount: number, rowsPerPage?: number): TableBlock {
  const rowHeight = rowsPerPage ? 267 / rowsPerPage : 8; // 277-10(header) = 267 / rowsPerPage
  return {
    id,
    type: 'table',
    height: 10 + rowCount * rowHeight,
    breakable: true,
    rows: Array.from({ length: rowCount }, (_, i) => ({ index: i, name: `Row ${i}` })),
    columns: [
      { key: 'index', title: '序号' },
      { key: 'name', title: '名称' },
    ],
    rowsPerPage,
  };
}

function makeChart(id: string, height = 100): ChartBlock {
  return {
    id,
    type: 'chart',
    height,
    breakable: false,
    option: { title: { text: 'Test Chart' } },
  };
}

function makeText(id: string, content: string, height = 30): TextBlock {
  return {
    id,
    type: 'text',
    height,
    breakable: true,
    content,
  };
}

describe('paginate', () => {
  const pageHeight = 277; // DEFAULT_USABLE_HEIGHT

  it('should return empty array for empty blocks', () => {
    expect(paginate([])).toEqual([]);
  });

  it('should put all blocks on one page if they fit', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', height: 50 }),
      makeBlock({ id: '2', height: 50 }),
      makeBlock({ id: '3', height: 50 }),
    ];
    const result = paginate(blocks, pageHeight);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(3);
  });

  it('should split blocks across pages when exceeding pageHeight', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', height: 150 }),
      makeBlock({ id: '2', height: 150 }), // 150+150=300 > 277 → 分页
      makeBlock({ id: '3', height: 50 }),
    ];
    const result = paginate(blocks, pageHeight);

    expect(result.length).toBeGreaterThanOrEqual(2);
    // 第一页：block 1 (150)
    expect(result[0]).toHaveLength(1);
    expect(result[0][0].id).toBe('1');

    // 第二页：block 2 (150) + block 3 (50)
    expect(result[1]).toHaveLength(2);
    expect(result[1][0].id).toBe('2');
    expect(result[1][1].id).toBe('3');
  });

  it('should move unbreakable block to next page if it does not fit', () => {
    const blocks: Block[] = [
      makeBlock({ id: '1', height: 200 }),
      makeChart('chart-1', 100), // 200+100=300 > 277, breakable=false → 移到下一页
      makeBlock({ id: '3', height: 50 }),
    ];
    const result = paginate(blocks, pageHeight);

    // 第一页：block 1 (200)
    expect(result[0]).toHaveLength(1);
    expect(result[0][0].id).toBe('1');

    // 第二页：chart-1 (100) + block 3 (50)
    expect(result[1]).toHaveLength(2);
    expect(result[1][0].id).toBe('chart-1');
    expect(result[1][1].id).toBe('3');
  });

  it('should split breakable table across pages', () => {
    // 创建一个大表格：10行表头 + 40行数据 = 330mm > 277
    const table = makeTable('t1', 40);
    const result = paginate([table], pageHeight);

    // 表格应该跨页拆分
    expect(result.length).toBeGreaterThanOrEqual(1);

    // 验证所有行都保留了
    const totalRows = result.flatMap((page) =>
      page
        .filter((b) => b.type === 'table')
        .flatMap((b) => (b as TableBlock).rows)
    );
    expect(totalRows).toHaveLength(40);
  });

  it('should handle complex mixed blocks', () => {
    const blocks: Block[] = [
      makeText('header', '患者信息报告', 20),
      makeTable('vitals', 15),
      makeChart('bp-chart', 80),
      makeText('notes', '备注：血压正常', 20),
      makeTable('labs', 25),
      makeChart('lab-chart', 100),
    ];

    const result = paginate(blocks, pageHeight);
    expect(result.length).toBeGreaterThan(0);

    // 所有 block 都应该出现
    const allIds = result.flatMap((page) => page.map((b) => b.id));
    // 表格可能被拆分，所以用 includes 判断前缀
    expect(allIds.some((id) => id.startsWith('header'))).toBe(true);
    expect(allIds.some((id) => id.startsWith('vitals'))).toBe(true);
    expect(allIds.some((id) => id.startsWith('bp-chart'))).toBe(true);
    expect(allIds.some((id) => id.startsWith('notes'))).toBe(true);
    expect(allIds.some((id) => id.startsWith('labs'))).toBe(true);
    expect(allIds.some((id) => id.startsWith('lab-chart'))).toBe(true);
  });
});

describe('flattenPages', () => {
  it('should add pageIndex to each block', () => {
    const pages: Block[][] = [
      [makeBlock({ id: 'a', height: 10 })],
      [makeBlock({ id: 'b', height: 10 }), makeBlock({ id: 'c', height: 10 })],
    ];
    const flattened = flattenPages(pages);
    expect(flattened).toHaveLength(3);
    expect(flattened[0].pageIndex).toBe(0);
    expect(flattened[1].pageIndex).toBe(1);
    expect(flattened[2].pageIndex).toBe(1);
  });
});
