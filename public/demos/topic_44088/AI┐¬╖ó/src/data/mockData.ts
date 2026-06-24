import type { ErrorQuestion } from "@/types/question";

/** 模拟识别返回类型 */
export type MockRecognizeResult = Omit<ErrorQuestion, "id" | "createdAt" | "imageUrl">;

// 模拟 AI 识别结果池:上传图片后随机返回其中一条
export const MOCK_RECOGNIZE_POOL: MockRecognizeResult[] = [
  {
    subject: "数学",
    questionText:
      "已知函数 f(x) = x² - 2ax + 3,若 f(x) 在区间 [1, 2] 上单调递增,求实数 a 的取值范围。",
    note: "对称轴判断错误,误将开口方向当作单调性条件。",
    knowledgePoints: ["二次函数", "单调性", "区间分析"],
    difficulty: 3,
    source: "期中试卷 · 第 15 题",
    confidence: 0.96,
  },
  {
    subject: "物理",
    questionText:
      "一物体从高 h 处自由下落,落到地面时的速度大小为 v。若物体下落过程中所受空气阻力大小恒为 f,求物体下落时间 t。",
    note: "未考虑阻力做功,动能定理应用错误。",
    knowledgePoints: ["自由落体", "牛顿第二定律", "动能定理"],
    difficulty: 4,
    source: "单元测试 · 第 8 题",
    confidence: 0.92,
  },
  {
    subject: "英语",
    questionText:
      "Choose the correct option: By the time he arrived at the station, the train ___. A. left  B. has left  C. had left  D. was leaving",
    note: "混淆了过去完成时与一般过去时的用法。",
    knowledgePoints: ["时态", "过去完成时", "by the time 句型"],
    difficulty: 2,
    source: "月考试卷 · 完形填空",
    confidence: 0.98,
  },
  {
    subject: "化学",
    questionText:
      "常温下,将 0.1 mol/L 的醋酸溶液加水稀释至原体积的 10 倍,稀释前后溶液中氢离子浓度的变化情况是?(已知醋酸 Ka = 1.8×10⁻⁵)",
    note: "误认为稀释后电离度增大则 c(H⁺) 也增大。",
    knowledgePoints: ["弱电解质电离", "稀释规律", "电离平衡常数"],
    difficulty: 4,
    source: "周练试卷 · 第 12 题",
    confidence: 0.89,
  },
  {
    subject: "数学",
    questionText:
      "在△ABC 中,已知 a=2,b=√3,A=60°,求角 B 的大小及边 c 的长度。",
    note: "正弦定理计算时漏掉了多解情况讨论。",
    knowledgePoints: ["正弦定理", "解三角形", "多解讨论"],
    difficulty: 3,
    source: "课后作业 · 第 6 题",
    confidence: 0.94,
  },
  {
    subject: "语文",
    questionText:
      "阅读《岳阳楼记》选段,回答:作者通过\"先天下之忧而忧,后天下之乐而乐\"表达了怎样的政治抱负?请结合时代背景简要分析。",
    note: "答题缺少时代背景支撑,论述空泛。",
    knowledgePoints: ["文言文阅读", "主旨理解", "论证分析"],
    difficulty: 3,
    source: "期中试卷 · 现代文阅读",
    confidence: 0.91,
  },
];

// 初始错题集 Mock 数据(用于错题集页展示)
export const INITIAL_QUESTIONS: ErrorQuestion[] = [
  {
    id: "q-init-001",
    subject: "数学",
    questionText:
      "已知函数 f(x) = x² - 2ax + 3,若 f(x) 在区间 [1, 2] 上单调递增,求实数 a 的取值范围。",
    note: "对称轴判断错误,误将开口方向当作单调性条件。",
    knowledgePoints: ["二次函数", "单调性"],
    difficulty: 3,
    imageUrl: "",
    createdAt: "2026-06-20T10:30:00Z",
    source: "期中试卷 · 第 15 题",
  },
  {
    id: "q-init-002",
    subject: "物理",
    questionText:
      "一物体从高 h 处自由下落,落到地面时的速度大小为 v。若所受空气阻力大小恒为 f,求下落时间 t。",
    note: "未考虑阻力做功,动能定理应用错误。",
    knowledgePoints: ["自由落体", "动能定理"],
    difficulty: 4,
    imageUrl: "",
    createdAt: "2026-06-18T14:20:00Z",
    source: "单元测试 · 第 8 题",
  },
  {
    id: "q-init-003",
    subject: "英语",
    questionText:
      "By the time he arrived at the station, the train ___. A. left  B. has left  C. had left  D. was leaving",
    note: "混淆了过去完成时与一般过去时。",
    knowledgePoints: ["时态", "过去完成时"],
    difficulty: 2,
    imageUrl: "",
    createdAt: "2026-06-15T09:10:00Z",
    source: "月考试卷 · 完形填空",
  },
  {
    id: "q-init-004",
    subject: "化学",
    questionText:
      "常温下,将 0.1 mol/L 醋酸溶液稀释至原体积 10 倍,稀释前后 c(H⁺) 变化?(Ka = 1.8×10⁻⁵)",
    note: "误认为稀释后电离度增大则 c(H⁺) 也增大。",
    knowledgePoints: ["弱电解质电离", "稀释规律"],
    difficulty: 4,
    imageUrl: "",
    createdAt: "2026-06-12T16:45:00Z",
    source: "周练试卷 · 第 12 题",
  },
  {
    id: "q-init-005",
    subject: "数学",
    questionText:
      "在△ABC 中,a=2,b=√3,A=60°,求角 B 的大小及边 c 的长度。",
    note: "正弦定理计算时漏掉了多解情况讨论。",
    knowledgePoints: ["正弦定理", "解三角形"],
    difficulty: 3,
    imageUrl: "",
    createdAt: "2026-06-10T11:00:00Z",
    source: "课后作业 · 第 6 题",
  },
  {
    id: "q-init-006",
    subject: "语文",
    questionText:
      "《岳阳楼记》中\"先天下之忧而忧,后天下之乐而乐\"表达了怎样的政治抱负?结合时代背景分析。",
    note: "答题缺少时代背景支撑,论述空泛。",
    knowledgePoints: ["文言文阅读", "主旨理解"],
    difficulty: 3,
    imageUrl: "",
    createdAt: "2026-06-08T08:30:00Z",
    source: "期中试卷 · 现代文阅读",
  },
];

// 模拟 AI 识别:延时返回随机一条
export function mockRecognize(): Promise<MockRecognizeResult> {
  const idx = Math.floor(Math.random() * MOCK_RECOGNIZE_POOL.length);
  const result = MOCK_RECOGNIZE_POOL[idx];
  return new Promise((resolve) => {
    setTimeout(() => resolve(result), 2200);
  });
}

// 示例照片的确定性识别结果(与 sample-paper.svg 内容匹配)
export function mockRecognizeSample(): Promise<MockRecognizeResult> {
  const result = MOCK_RECOGNIZE_POOL[0]; // 数学:二次函数单调性
  return new Promise((resolve) => {
    setTimeout(() => resolve(result), 2200);
  });
}
