# @a4-pagination-print/core

[![npm version](https://img.shields.io/npm/v/@a4-pagination-print/core)](https://www.npmjs.com/package/@a4-pagination-print/core)
[![license](https://img.shields.io/npm/l/@a4-pagination-print/core)](https://github.com/qizhifeng00/a4-pagination-print-core/blob/main/LICENSE)

A4 分页核心引擎 — 纯 TypeScript，零 DOM 依赖，可在浏览器和 Node.js 中使用。

```bash
npm install @a4-pagination-print/core
```

## 适用场景

- 在**任何 JavaScript 运行时**（浏览器 / Node.js / Deno）中做 A4 分页计算
- 作为底层引擎，搭配 `@a4-pagination-print/vue` 或 `@a4-pagination-print/react` 使用
- 需要在服务端做预分页、PDF 生成等

## 功能

### datePaginate — 日期感知分页

```typescript
import { datePaginate, getPaginationMeta } from '@a4-pagination-print/core';
import type { DateGroup } from '@a4-pagination-print/core';

const groups: DateGroup[] = [
  { date: '2026-07-24', blocks: [...] },
  { date: '2026-07-25', blocks: [...] },
];

const pages = datePaginate(groups);
// → Page[]  每个元素: { date, pageNumber, blocks }

const meta = getPaginationMeta(pages);
// → { totalPages, dates, pagesPerDate, pageIndexMap }
```

### measureBlock — 高度测量

```typescript
import { measureBlock, measureBlocks } from '@a4-pagination-print/core';

const result = measureBlock(block);
// → { height: number, rowHeights?: number[] }

const measured = measureBlocks(blocks);
```

### PageNavigator — 翻页导航

```typescript
import { PageNavigator } from '@a4-pagination-print/core';

const nav = new PageNavigator(pages);
nav.next();            // → { success, globalIndex, date, pageNumber }
nav.prev();
nav.goToDate('2026-07-25');
nav.goTo(3);
```

### 可插拔测量策略

```typescript
import type { MeasureStrategy, Block } from '@a4-pagination-print/core';

const myStrategy: MeasureStrategy = {
  measureBlock(block: Block): Block {
    return { ...block, height: myPreciseMeasure(block) };
  },
  measureBlocks(blocks: Block[]): Block[] {
    return blocks.map((b) => this.measureBlock(b));
  },
};

const pages = datePaginate(groups, { measureStrategy: myStrategy });
```

### 打印样式

```typescript
import { generatePrintCSS, generatePrintAllCSS } from '@a4-pagination-print/core';
import {
  PAGE_STYLE, HEADER_STYLE, FOOTER_STYLE,
  TABLE_STYLE, TH_STYLE, TD_STYLE,
  TEXT_STYLE, INPUT_TEXTAREA_STYLE,
} from '@a4-pagination-print/core';
```

## 核心类型

```typescript
type BlockType = 'table' | 'chart' | 'input' | 'text' | 'custom';

interface Block {
  id: string;
  type: BlockType;
  height: number;       // mm，0 = 自动测量
  breakable: boolean;   // 允许跨页拆分
}

interface DateGroup { date: string; blocks: Block[]; }

interface Page { date: string; pageNumber: number; blocks: Block[]; }
```

## 分页规则

1. 遍历 blocks，累积高度
2. 放不下时：可拆分表格 → 逐行累加拆分，不可拆分 → 整体移到下一页
3. 底部保留 2mm 安全边距防截断
4. 每个日期独立分页，页码从 1 开始
5. 输入数据不会被修改

## License

MIT
