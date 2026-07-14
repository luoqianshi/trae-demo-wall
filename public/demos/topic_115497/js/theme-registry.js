// ============================================================
// js/theme-registry.js
// 中华文化粒子云引擎 · 主题注册表
// 由于纯 ES module 无法扫描目录，采用显式注册表方式
// 每条记录：{ id, module: () => import(...), namedExport?: string }
//   - namedExport 缺省时取模块 default 导出
//   - 命名导出用于一个文件承载多个主题（如 classic-6.js 内 6 个经典场景）
// Task 4 才创建实际主题数据文件，本表先以动态 import 占位，Task 4 会同步更新
// ============================================================

export const THEME_REGISTRY = [
  // ===== 6 个经典场景（与 2D 引擎 SCENES 对齐，单一文件多命名导出）=====
  { id: 'qianshan',   module: () => import('../themes/classic-6.js'), namedExport: 'qianshan'   },
  { id: 'yuebo',      module: () => import('../themes/classic-6.js'), namedExport: 'yuebo'      },
  { id: 'mudan',      module: () => import('../themes/classic-6.js'), namedExport: 'mudan'      },
  { id: 'lanting',    module: () => import('../themes/classic-6.js'), namedExport: 'lanting'    },
  { id: 'xingxiu',    module: () => import('../themes/classic-6.js'), namedExport: 'xingxiu'    },
  { id: 'yanyu',      module: () => import('../themes/classic-6.js'), namedExport: 'yanyu'      },

  // ===== 6 个新增扩展主题（独立文件，default 导出）=====
  { id: 'tangshi',     module: () => import('../themes/tangshi.js')     },  // 唐诗星河
  { id: 'songci',      module: () => import('../themes/songci.js')      },  // 宋词长卷
  { id: 'chuci',       module: () => import('../themes/chuci.js')       },  // 楚辞九歌
  { id: 'shanhaijing', module: () => import('../themes/shanhaijing.js') },  // 山海经异兽
  { id: 'jieqi',       module: () => import('../themes/jieqi.js')       },  // 二十四节气
  { id: 'baijiaxing',  module: () => import('../themes/baijiaxing.js') },  // 百家姓谱

  // ===== 测试主题（验证用，Task 3 创建）=====
  { id: '_test',      module: () => import('../themes/_test-theme.js') }
];

// 功能描述：中华文化粒子云引擎的主题注册表。以显式数组形式登记 13 个主题（6 个经典场景 classic-6.js 命名导出：qianshan/yuebo/mudan/lanting/xingxiu/yanyu + 6 个新增扩展主题独立文件 default 导出：tangshi 唐诗星河 / songci 宋词长卷 / chuci 楚辞九歌 / shanhaijing 山海经异兽 / jieqi 二十四节气 / baijiaxing 百家姓谱 + 1 个 _test 测试主题）。每条记录含 id、module（动态 import 工厂函数）、可选 namedExport（命名导出名，缺省取 default）。供 ThemeLoader.list/load/loadAll 查询与加载，Task 4 创建实际主题数据文件后与表内 id 与路径完全对齐即可生效。
