import { describe, it, expect } from 'vitest';
import {
  measureTableHeight,
  measureChartHeight,
  measureInputHeight,
  measureTextHeight,
  measureBlock,
  measureBlocks,
} from '../measure';
import type { Block, TableBlock, ChartBlock, TextBlock, InputBlock } from '../types';

describe('measureTableHeight', () => {
  it('should calculate table height with header', () => {
    const height = measureTableHeight(10, 8, true);
    expect(height).toBe(90);
  });

  it('should calculate table height without header', () => {
    const height = measureTableHeight(10, 8, false);
    expect(height).toBe(80);
  });

  it('should return only header height for 0 rows', () => {
    expect(measureTableHeight(0)).toBe(10);
  });
});

describe('measureChartHeight', () => {
  it('should return default chart height', () => {
    expect(measureChartHeight()).toBe(100);
  });

  it('should return custom chart height', () => {
    expect(measureChartHeight(120)).toBe(120);
  });
});

describe('measureInputHeight', () => {
  it('should return default for single line', () => {
    expect(measureInputHeight()).toBe(20);
  });

  it('should scale with line count', () => {
    expect(measureInputHeight(3)).toBe(60);
  });
});

describe('measureTextHeight', () => {
  it('should return 0 for empty content', () => {
    expect(measureTextHeight('')).toBe(0);
  });

  it('should estimate height for single line', () => {
    const height = measureTextHeight('Hello', 3.5, 1.5, 180);
    expect(height).toBeGreaterThan(0);
  });

  it('should be larger for multi-line text', () => {
    const singleLine = measureTextHeight('Hello', 3.5, 1.5, 180);
    const multiLine = measureTextHeight('Hello\nWorld\nTest', 3.5, 1.5, 180);
    expect(multiLine).toBeGreaterThan(singleLine);
  });
});

describe('measureBlock', () => {
  it('should measure table blocks', () => {
    const block = {
      id: 't1',
      type: 'table' as const,
      height: 0,
      breakable: true,
      rows: Array.from({ length: 5 }, (_, i) => ({ index: i })),
      columns: [{ key: 'index', title: '序号' }],
    } as TableBlock;
    const measured = measureBlock(block);
    expect(measured.height).toBeGreaterThan(0);
  });

  it('should measure chart blocks', () => {
    const block = {
      id: 'c1',
      type: 'chart' as const,
      height: 0,
      breakable: false,
      option: { title: { text: 'Test' } },
    } as ChartBlock;
    const measured = measureBlock(block);
    expect(measured.height).toBe(100);
  });

  it('should use existing height if > 0', () => {
    const block = {
      id: 'x1',
      type: 'text' as const,
      height: 50,
      breakable: true,
      content: 'test',
    } as TextBlock;
    const measured = measureBlock(block);
    expect(measured.height).toBe(50);
  });
});

describe('measureBlocks', () => {
  it('should measure all blocks in array', () => {
    const blocks: Block[] = [
      { id: '1', type: 'text', height: 0, breakable: true, content: 'Hello' } as TextBlock,
      { id: '2', type: 'chart', height: 0, breakable: false, option: {} } as ChartBlock,
    ];

    const measured = measureBlocks(blocks);
    expect(measured).toHaveLength(2);
    for (const b of measured) {
      expect(b.height).toBeGreaterThan(0);
    }
  });
});
