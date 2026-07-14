/* ===== demoData.js · 演示用预置历史记录 =====
 * 对应"解析台"4 道示例题的 AI 解析结果
 * 首次启动且无历史时自动注入
 */
window.DemoData = (function () {

  const NOW = Date.now();
  const HOUR = 3600 * 1000;
  const DAY = 24 * HOUR;

  const DEMO_HISTORY = [
    // ===== 1. 数学·二次函数 =====
    {
      id: 'demo-math-001',
      createdAt: NOW - 2 * HOUR,
      subject: '数学',
      question: '求二次函数 y = x² - 4x + 3 的顶点坐标、对称轴和根，并画出函数图像。',
      result: {
        subject: '数学',
        question: '求二次函数 $y = x^2 - 4x + 3$ 的顶点坐标、对称轴和根，并画出函数图像。',
        explanation: '步骤一：使用配方法将一般式化为顶点式。\n$y = x^2 - 4x + 3$\n配方：$y = (x^2 - 4x + 4) - 4 + 3 = (x-2)^2 - 1$\n因此顶点式为 $y = (x-2)^2 - 1$。\n\n步骤二：由顶点式直接读出顶点坐标与对称轴。\n顶点坐标为 $(2, -1)$，对称轴为直线 $x = 2$。\n由于二次项系数 $a = 1 > 0$，抛物线开口向上，顶点为最低点（最小值）。\n\n步骤三：求根（令 $y = 0$）。\n$(x-2)^2 - 1 = 0$\n$(x-2)^2 = 1$\n$x - 2 = \\pm 1$\n解得 $x_1 = 1$，$x_2 = 3$。\n故两根为 $x = 1$ 和 $x = 3$。\n\n步骤四：辅助作图。\ny 轴截距：令 $x = 0$，$y = 3$，即 $(0, 3)$。\n由对称性，$x = 4$ 时 $y = 3$，即 $(4, 3)$。\n描点连线即可得抛物线图像。',
        summary: '本题考查二次函数的三式互化（一般式↔顶点式）与性质读取。配方法是核心，配方后可一次性读出顶点、对称轴与最值；求根令 y=0 解一元二次方程即可。开口方向由 a 的正负决定。',
        graph: {
          graphType: 'quadratic',
          graphParams: {
            a: 1, b: -4, c: 3,
            vertex: { x: 2, y: -1 },
            roots: [1, 3],
            axisOfSymmetry: 2,
            opening: 'up',
            vertexForm: 'y = (x-2)² - 1'
          }
        }
      }
    },

    // ===== 2. 物理·受力分析 =====
    {
      id: 'demo-phys-001',
      createdAt: NOW - 5 * HOUR,
      subject: '物理',
      question: '如图，一个质量为 m 的木块静止在倾角为 30° 的斜面上，请分析木块的受力情况（重力、支持力、摩擦力），并画出受力分析图。',
      result: {
        subject: '物理',
        question: '一个质量为 $m$ 的木块静止在倾角为 $\\theta = 30°$ 的斜面上，分析木块的受力情况并画出受力分析图。',
        explanation: '步骤一：确定研究对象与受力对象。\n研究对象为木块（可视为质点）。木块静止在斜面上，处于平衡状态（合外力为零）。\n\n步骤二：分析受力（共三个力）。\n1. 重力 $G = mg$：方向竖直向下，作用在木块重心。\n2. 支持力 $N$：方向垂直斜面向外（斜上方），由斜面施加。\n3. 静摩擦力 $f$：方向沿斜面向上，阻碍木块下滑趋势。\n\n步骤三：建立坐标系分解重力。\n以沿斜面向下为 x 轴正方向，垂直斜面向下为 y 轴正方向。\n重力 $G$ 沿斜面分量：$G_x = mg\\sin\\theta = mg\\sin 30° = \\frac{1}{2}mg$\n重力 $G$ 垂直斜面分量：$G_y = mg\\cos\\theta = mg\\cos 30° = \\frac{\\sqrt{3}}{2}mg$\n\n步骤四：列平衡方程求解。\nx 方向平衡：$f = G_x = mg\\sin 30° = \\frac{1}{2}mg$\ny 方向平衡：$N = G_y = mg\\cos 30° = \\frac{\\sqrt{3}}{2}mg$\n\n步骤五：结论。\n支持力 $N = mg\\cos 30° \\approx 0.866mg$\n静摩擦力 $f = mg\\sin 30° = 0.5mg$\n若斜面能保持木块静止，需满足 $f \\leq f_{max} = \\mu N$，即 $\\tan 30° \\leq \\mu$，故 $\\mu \\geq \\frac{\\sqrt{3}}{3}$。',
        summary: '斜面问题核心是"分解重力"：沿斜面方向与垂直斜面方向建立坐标轴。重力沿斜面分量 mg sinθ 决定下滑趋势，垂直分量 mg cosθ 决定支持力大小。静止平衡时摩擦力等于下滑分量，最大静摩擦力等于 μN。',
        graph: {
          graphType: 'forceDiagram',
          graphParams: {
            object: '木块（斜面）',
            forces: [
              { name: '重力G', direction: 'down', magnitude: 'mg', point: { x: 0, y: 0 } },
              { name: '支持力N', direction: 'angle', magnitude: 'mgcosθ', point: { x: 0, y: 0 } },
              { name: '摩擦力f', direction: 'angle', magnitude: 'μN', point: { x: 0, y: 0 } }
            ],
            coordinateSystem: 'xy',
            inclination: 30
          }
        }
      }
    },

    // ===== 3. 生物·遗传图解 =====
    {
      id: 'demo-bio-001',
      createdAt: NOW - 1 * DAY,
      subject: '生物',
      question: '孟德尔豌豆杂交实验：纯种高茎豌豆（DD）与矮茎豌豆（dd）杂交，得到 F1 代，F1 代自交得到 F2 代。请画出遗传图解，标注各代基因型与表现型比例。',
      result: {
        subject: '生物',
        question: '孟德尔豌豆杂交实验：纯种高茎豌豆（DD）与矮茎豌豆（dd）杂交得到 F₁ 代，F₁ 代自交得到 F₂ 代。画出遗传图解，标注各代基因型与表现型比例。',
        explanation: '步骤一：确定相对性状与显隐性。\n豌豆茎高由一对等位基因 D/d 控制。高茎（D）对矮茎（d）为显性。纯种高茎基因型为 DD，纯种矮茎基因型为 dd。\n\n步骤二：亲代（P）杂交。\n亲本：♀ DD × ♂ dd\nDD 个体只产生配子 D；dd 个体只产生配子 d。\n\n步骤三：子一代（F₁）。\n雌雄配子结合：D + d → Dd\nF₁ 基因型全为 Dd（杂合子），由于 D 显性，表现型全为高茎，比例 100% 高茎。\n\n步骤四：F₁ 自交。\nF₁（Dd）自交，每个 F₁ 个体产生两种配子 D 和 d，比例为 1:1。\n\n步骤五：F₂ 棋盘格分析（Punnett Square）。\n雌配子：D、d；雄配子：D、d\n四种组合：DD、Dd、Dd、dd\n基因型比：DD : Dd : dd = 1 : 2 : 1\n表现型比：高茎（DD+Dd）: 矮茎（dd）= 3 : 1\n\n步骤六：分离定律结论。\n在杂合子（Dd）的自交后代中，等位基因彼此分离，形成两种配子，随机结合后出现 3:1 的性状分离比。这印证了分离定律：一对等位基因在形成配子时彼此分离，互不干扰。',
        summary: '分离定律核心：杂合子 Dd 自交后代出现 3:1 性状分离比。基因型比 1:2:1，表现型比 3:1。关键在于 F₁ 产生两种配子（D:d=1:1）随机结合。棋盘格法是验证遗传规律的标准工具。',
        graph: {
          graphType: 'geneticDiagram',
          graphParams: {
            generations: [
              { generation: 'P', genotype: 'DD × dd', phenotype: '高茎 × 矮茎', ratio: '—' },
              { generation: 'F₁', genotype: 'Dd', phenotype: '高茎', ratio: '100% 高茎' },
              { generation: 'F₂', genotype: 'DD : Dd : dd', phenotype: '高茎 : 矮茎', ratio: '3 : 1' }
            ],
            inheritanceType: '显性'
          }
        }
      }
    },

    // ===== 4. 语文·议论文结构 =====
    {
      id: 'demo-chinese-001',
      createdAt: NOW - 2 * DAY,
      subject: '语文',
      question: '以"坚持的力量"为题，写一篇议论文。请给出文章结构图，包含开头引题、主体三段论证、结尾升华五部分，每部分列出要点与字数。',
      result: {
        subject: '语文',
        question: '以"坚持的力量"为题，写一篇议论文。给出文章结构图，包含开头引题、主体三段论证、结尾升华五部分，每部分列出要点与字数。',
        explanation: '步骤一：确立中心论点与论证思路。\n中心论点：坚持是成功的基石。采用"引—议—联—结"的经典五段式结构，从名言引入，到古今中外事例论证，再到反面论证方向的重要性，最后升华主题。\n\n步骤二：开头·引题（约 80 字）。\n引用荀子《劝学》"锲而不舍，金石可镂"开篇，引出"坚持"话题，提出中心论点：坚持是通向成功的必经之路，是成就梦想的基石。开头要简洁有力，亮明观点。\n\n步骤三：主体·论证一（约 200 字）。\n分论点一：坚持能跨越困难。\n事例：司马迁忍辱负重十余年，在身受宫刑的极大苦难中坚持撰写《史记》，终成"史家之绝唱，无韵之离骚"。论证要点：困难是坚持的试金石，唯有坚持才能把苦难化为财富。\n\n步骤四：主体·论证二（约 200 字）。\n分论点二：坚持能成就梦想。\n事例：爱迪生为发明电灯，经历上千次实验失败仍不放弃，最终找到钨丝，照亮世界。论证要点：坚持让梦想从可能性变为现实性，量的积累终将带来质的飞跃。\n\n步骤五：主体·论证三（约 100 字）。\n分论点三：坚持需正确方向。\n反面论证：引用"南辕北辙"典故，说明方向错误的坚持只会南辕北辙，越走越远。论证要点：坚持的前提是方向正确，盲目坚持不如及时调整。\n\n步骤六：结尾·升华（约 120 字）。\n总结全文三个分论点，呼应开头荀子名言，发出号召：让坚持成为习惯，让正确方向指引前行。结尾要升华主题，从个人坚持上升到时代精神，激励读者在人生道路上持之以恒。',
        summary: '议论文五段式结构：引（名言引入亮观点）—议（事例论证分论点）—联（正反对比深化）—结（升华呼应号召）。论证要"摆事实+讲道理"双线并行，事例需典型有代表性，结尾要回扣开头形成闭环。',
        graph: {
          graphType: 'essayStructure',
          graphParams: {
            theme: '坚持的力量',
            sections: [
              { title: '开头·引题', keyPoints: ['引用名言：锲而不舍，金石可镂', '提出中心论点：坚持是成功的基石'], wordCount: 80 },
              { title: '主体·论证一', keyPoints: ['分论点：坚持能跨越困难', '事例：司马迁忍辱写《史记》'], wordCount: 200 },
              { title: '主体·论证二', keyPoints: ['分论点：坚持能成就梦想', '事例：爱迪生千次实验发明电灯'], wordCount: 200 },
              { title: '主体·论证三', keyPoints: ['分论点：坚持需正确方向', '反面论证：南辕北辙的教训'], wordCount: 100 },
              { title: '结尾·升华', keyPoints: ['总结全文', '呼应开头', '发出号召：让坚持成为习惯'], wordCount: 120 }
            ]
          }
        }
      }
    },

    // ===== 5. 生物·食物链与食物网 =====
    {
      id: 'demo-bio-002',
      createdAt: NOW - 3 * DAY,
      subject: '生物',
      question: '某草原生态系统中，草是生产者，兔和鼠以草为食，狐捕食兔和鼠，鹰也捕食鼠，兔与鼠之间存在竞争关系。请画出该生态系统的食物链与食物网图，标注各物种的营养级。',
      result: {
        subject: '生物',
        question: '某草原生态系统中，草是生产者，兔和鼠以草为食，狐捕食兔和鼠，鹰也捕食鼠，兔与鼠之间存在竞争关系。请画出该生态系统的食物链与食物网图，标注各物种的营养级。',
        explanation: '步骤一：识别生态系统中的物种及其营养级。\n草——能通过光合作用制造有机物，属于生产者。\n兔、鼠——直接以植物为食，属于初级消费者。\n狐、鹰——以其他动物为食，属于次级消费者。\n\n步骤二：梳理捕食关系，构建食物链。\n从生产者开始，沿能量流动方向依次连接：\n食物链1：草 → 兔 → 狐\n食物链2：草 → 鼠 → 狐\n食物链3：草 → 鼠 → 鹰\n每条食物链的起点都是生产者，箭头指向捕食者（高营养级）。\n\n步骤三：分析竞争关系。\n兔和鼠都以草为食，生态位重叠，争夺相同的植物资源，构成竞争关系。竞争关系在图中用虚线双向箭头表示。\n\n步骤四：将多条食物链整合为食物网。\n一个生态系统中通常存在多条食物链，彼此交错连接形成食物网。本例中 5 个物种、3 条食物链、1 条竞争关系共同构成该草原生态系统的食物网。\n\n步骤五：总结生态学意义。\n食物网越复杂，生态系统越稳定；若某物种数量剧变，会通过食物网传导影响其他物种。例如鼠大量减少时，狐和鹰的食物来源减少，草的数量则会上升。',
        summary: '食物链是能量流动的单向通道，食物网是多条食物链交错形成的复杂结构。营养级从低到高为：生产者→初级消费者→次级消费者。竞争关系发生在同营养级的物种之间。食物网复杂度决定生态系统稳定性。',
        graph: {
          graphType: 'ecosystemDiagram',
          graphParams: {
            species: [
              { name: '草', trophicLevel: '生产者' },
              { name: '兔', trophicLevel: '初级消费者' },
              { name: '鼠', trophicLevel: '初级消费者' },
              { name: '狐', trophicLevel: '次级消费者' },
              { name: '鹰', trophicLevel: '次级消费者' }
            ],
            relationships: [
              { from: '草', to: '兔', type: '捕食' },
              { from: '草', to: '鼠', type: '捕食' },
              { from: '兔', to: '狐', type: '捕食' },
              { from: '鼠', to: '狐', type: '捕食' },
              { from: '鼠', to: '鹰', type: '捕食' },
              { from: '兔', to: '鼠', type: '竞争' }
            ]
          }
        }
      }
    },
  ];

  // 判断是否已有演示数据（避免重复注入）
  function isInjected() {
    const list = Store.getHistory();
    return list.some(it => it.id && String(it.id).indexOf('demo-') === 0);
  }

  // 注入演示数据（仅当历史为空或无演示数据时）
  function injectIfNeeded() {
    if (isInjected()) return false;
    const existing = Store.getHistory();
    // 演示数据按时间正序追加（最早的在前，最新的在后），保证 unshift 后时间倒序
    const merged = DEMO_HISTORY.concat(existing);
    try {
      localStorage.setItem('edugraph_history', JSON.stringify(merged.slice(0, Store.MAX_HISTORY)));
      return true;
    } catch (e) {
      console.warn('演示数据注入失败:', e);
      return false;
    }
  }

  // 手动重新注入（合并到现有历史，避免覆盖用户数据）
  function reinject() {
    const existing = Store.getHistory();
    // 过滤掉已有的演示数据，再合并
    const userOnly = existing.filter(it => !it.id || String(it.id).indexOf('demo-') !== 0);
    const merged = DEMO_HISTORY.concat(userOnly);
    try {
      localStorage.setItem('edugraph_history', JSON.stringify(merged.slice(0, Store.MAX_HISTORY)));
      return true;
    } catch (e) { return false; }
  }

  return {
    DEMO_HISTORY,
    isInjected,
    injectIfNeeded,
    reinject,
  };
})();
