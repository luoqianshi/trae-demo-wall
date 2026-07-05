import { MOCK_QUESTIONS } from "@/data/mockQuestions";
import { createQuestion, randomErrorReason } from "@/store/useQuestionStore";
import type { Question } from "@/types";

/**
 * 模拟 AI 识别：从内置题库中随机抽取若干道题，
 * 加入随机错因与掌握度，延时 1.6-2.4s 模拟识别耗时。
 * 真实场景下，可替换为 OCR + LLM API 调用。
 */
export function mockRecognize(imageFiles: File[]): Promise<Question[]> {
  const delay = 1600 + Math.random() * 800;
  return new Promise((resolve) => {
    setTimeout(() => {
      // 每张图平均识别 1-3 道题
      const count = Math.max(1, Math.min(8, imageFiles.length * 2));
      // 从全题库中随机抽取
      const pool = [...MOCK_QUESTIONS];
      const picked: typeof MOCK_QUESTIONS = [];
      for (let i = 0; i < count && pool.length > 0; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        picked.push(pool.splice(idx, 1)[0]);
      }
      const questions = picked.map((q) => {
        const enriched = {
          ...q,
          errorReason: q.errorReason ?? randomErrorReason(),
        };
        return createQuestion(enriched);
      });
      resolve(questions);
    }, delay);
  });
}

/**
 * 模拟扫描试卷进度回调。
 * onProgress: 0-100
 */
export function mockScanProgress(
  onProgress: (p: number) => void,
  onDone: () => void,
) {
  let p = 0;
  const timer = setInterval(() => {
    p += 4 + Math.random() * 8;
    if (p >= 100) {
      p = 100;
      onProgress(100);
      clearInterval(timer);
      onDone();
    } else {
      onProgress(p);
    }
  }, 80);
  return () => clearInterval(timer);
}
