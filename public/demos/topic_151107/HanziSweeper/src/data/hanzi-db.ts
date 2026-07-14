/**
 * 汉字拆解数据库
 * 每个汉字拆分为两个组件（部首/部件），所有组件全局唯一
 *
 * ⚠️ 此文件是 TypeScript 算法验证测试夹具，不是运行时数据源。
 *
 * - 运行时主数据源：js/data.js（含 303 条富字段记录，被浏览器加载）
 * - 本文件：38 条极简记录，仅用于 src/validate.ts 通过 ts-node 离线验证算法
 * - 项目无 build 流程，js/data.js 与本文件无自动同步机制
 * - 新增汉字到 js/data.js 时，若需在算法验证中覆盖该字，请同步添加到本文件
 *
 * 详见：src/validate.ts、src/core/board-generator.ts
 */

import { CharDecomp } from '../core/types';

export const HANZI_DB: CharDecomp[] = [
  // ---- 简单（常见部首，一目了然）----
  { char: '河', left: '氵', right: '可' },
  { char: '明', left: '日', right: '月' },
  { char: '休', left: '亻', right: '木' },
  { char: '妈', left: '女', right: '马' },
  { char: '好', left: '女', right: '子' },   // 注意：与妈共享"女"，生成时互斥
  { char: '林', left: '木', right: '木' },   // 同组件，特殊处理
  { char: '早', left: '日', right: '十' },
  { char: '尖', left: '小', right: '大' },

  // ---- 中等 ----
  { char: '相', left: '木', right: '目' },
  { char: '法', left: '氵', right: '去' },
  { char: '破', left: '石', right: '皮' },
  { char: '松', left: '木', right: '公' },
  { char: '清', left: '氵', right: '青' },
  { char: '精', left: '米', right: '青' },
  { char: '性', left: '忄', right: '生' },
  { char: '灯', left: '火', right: '丁' },
  { char: '让', left: '讠', right: '上' },
  { char: '饭', left: '饣', right: '反' },
  { char: '抱', left: '扌', right: '包' },
  { char: '做', left: '亻', right: '故' },
  { char: '会', left: '人', right: '云' },
  { char: '挑', left: '扌', right: '兆' },
  { char: '岩', left: '山', right: '石' },
  { char: '忠', left: '中', right: '心' },
  { char: '尘', left: '小', right: '土' },
  { char: '男', left: '田', right: '力' },
  { char: '歪', left: '不', right: '正' },
  { char: '吞', left: '天', right: '口' },
  { char: '吹', left: '口', right: '欠' },
  { char: '跑', left: '足', right: '包' },

  // ---- 较难 ----
  { char: '想', left: '相', right: '心' },
  { char: '闻', left: '门', right: '耳' },
  { char: '问', left: '门', right: '口' },
  { char: '闷', left: '门', right: '心' },
  { char: '闪', left: '门', right: '人' },
  { char: '闭', left: '门', right: '才' },
  { char: '阔', left: '门', right: '活' },
  { char: '阀', left: '门', right: '伐' },
];

/**
 * 从数据库中选取一组互不冲突的汉字（所有组件全局唯一）
 * @param count 选取数量
 * @param exclude 需要排除的组件
 * @returns 选取的汉字拆解列表，以及使用的组件集合
 */
export function selectCharacters(
  count: number,
  exclude: Set<string> = new Set()
): { selected: CharDecomp[]; components: Set<string> } {
  const shuffled = [...HANZI_DB].sort(() => Math.random() - 0.5);
  const selected: CharDecomp[] = [];
  const usedComponents = new Set(exclude);

  for (const entry of shuffled) {
    if (selected.length >= count) break;

    const { left, right } = entry;

    // 林 这种同组件的特殊字，需要两个相同组件都可用
    if (left === right) {
      if (usedComponents.has(left)) continue;
    } else {
      if (usedComponents.has(left) || usedComponents.has(right)) continue;
    }

    selected.push(entry);
    usedComponents.add(left);
    usedComponents.add(right);
  }

  return { selected, components: usedComponents };
}

/**
 * 获取所有组件列表（从选中的汉字中）
 */
export function getComponents(selected: CharDecomp[]): string[] {
  const components: string[] = [];
  for (const entry of selected) {
    components.push(entry.left);
    components.push(entry.right);
  }
  return components;
}

/**
 * 验证两个组件是否能组成汉字，返回组成的汉字或 null
 */
export function matchComponents(a: string, b: string): string | null {
  for (const entry of HANZI_DB) {
    if (
      (entry.left === a && entry.right === b) ||
      (entry.left === b && entry.right === a)
    ) {
      return entry.char;
    }
  }
  return null;
}
