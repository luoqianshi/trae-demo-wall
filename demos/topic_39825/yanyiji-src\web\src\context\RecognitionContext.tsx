import { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  recognizeImage,
  recognizeDocument,
  reRecognizeImage,
  saveFormulasBatch,
  RecognizeResponse,
  DocumentRecognizeResponse,
} from '../services/api';

// 识别任务状态
export interface ImageTask {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result: RecognizeResponse | null;
  error: string | null;
  imageBase64: string;   // 原始图片 base64（用于重新识别）
}

export interface DocResultWithImage {
  result: RecognizeResponse;
  imageBase64: string;    // 对应的原始图片 base64
}

export interface DocTask {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  documentName: string;
  results: DocResultWithImage[];
  rawResults: RecognizeResponse[];  // 兼容旧接口
  error: string | null;
  progress: string;
}

interface RecognitionContextType {
  // 图片任务
  imageTasks: ImageTask[];
  addImageTask: (file: File) => Promise<void>;
  clearImageTasks: () => void;

  // 文档任务
  docTask: DocTask | null;
  startDocTask: (file: File) => Promise<void>;
  clearDocTask: () => void;

  // 重新识别
  rerenderDocResult: (index: number, imageBase64: string) => Promise<void>;

  // 保存状态
  saving: boolean;
  saved: boolean;
  saveToLibrary: () => Promise<void>;

  // 活跃任务数
  activeCount: number;
}

const RecognitionContext = createContext<RecognitionContextType | null>(null);

let taskIdCounter = 0;

export function RecognitionProvider({ children }: { children: React.ReactNode }) {
  const [imageTasks, setImageTasks] = useState<ImageTask[]>([]);
  const [docTask, setDocTask] = useState<DocTask | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // 用 ref 跟踪当前任务，避免闭包问题
  const imageTasksRef = useRef(imageTasks);
  imageTasksRef.current = imageTasks;
  const docTaskRef = useRef(docTask);
  docTaskRef.current = docTask;

  const activeCount =
    (docTask && docTask.status === 'processing' ? 1 : 0) +
    imageTasks.filter((t) => t.status === 'processing').length;

  const addImageTask = useCallback(async (file: File) => {
    const id = `img-${++taskIdCounter}`;

    // 转换为 base64（用于重新识别）
    const reader = new FileReader();
    const imageBase64 = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    // 去掉 data:image/xxx;base64, 前缀
    const base64Data = imageBase64.split(',')[1] || '';

    const task: ImageTask = {
      id,
      status: 'pending',
      result: null,
      error: null,
      imageBase64: base64Data,
    };

    setImageTasks((prev) => [task, ...prev]);

    // 更新为 processing
    setImageTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'processing' } : t))
    );

    try {
      const result = await recognizeImage(file);
      setImageTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, status: 'done', result } : t
        )
      );
    } catch (err: any) {
      setImageTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: 'error', error: err.message || '识别失败' }
            : t
        )
      );
    }
  }, []);

  const clearImageTasks = useCallback(() => {
    setImageTasks([]);
  }, []);

  const startDocTask = useCallback(async (file: File) => {
    const id = `doc-${++taskIdCounter}`;

    const task: DocTask = {
      id,
      status: 'pending',
      documentName: file.name,
      results: [],
      rawResults: [],
      error: null,
      progress: '正在解析文档...',
    };

    setDocTask(task);
    setSaved(false);

    // 更新为 processing
    setDocTask((prev) =>
      prev ? { ...prev, status: 'processing', progress: '正在解析文档...' } : null
    );

    try {
      setDocTask((prev) =>
        prev ? { ...prev, progress: '正在识别公式...' } : null
      );
      const result = await recognizeDocument(file);
      // 将结果与图片 base64 配对
      const images = result.result_images || [];
      const paired: DocResultWithImage[] = result.results.map((r, i) => ({
        result: r,
        imageBase64: images[i] || '',
      }));
      setDocTask((prev) =>
        prev
          ? {
              ...prev,
              status: 'done',
              results: paired,
              rawResults: result.results,
              progress: '',
            }
          : null
      );
    } catch (err: any) {
      setDocTask((prev) =>
        prev
          ? {
              ...prev,
              status: 'error',
              error: err.message || '文档识别失败',
              progress: '',
            }
          : null
      );
    }
  }, []);

  const clearDocTask = useCallback(() => {
    setDocTask(null);
  }, []);

  const saveToLibrary = useCallback(async () => {
    const currentDoc = docTaskRef.current;
    if (!currentDoc || currentDoc.results.length === 0) return;

    setSaving(true);
    try {
      const docName = currentDoc.documentName.replace(/\.[^.]+$/, '');
      await saveFormulasBatch({
        formulas: currentDoc.results.map((item) => ({
          latex_code: item.result.latex,
          confidence: item.result.confidence,
        })),
        source_paper_title: docName,
        category: 'document',
      });
      setSaved(true);
    } catch (err: any) {
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  // 重新识别文档中的某个公式
  const rerenderDocResult = useCallback(async (index: number, imageBase64: string) => {
    if (!imageBase64) return;
    try {
      const newResult = await reRecognizeImage(imageBase64);
      // 更新对应位置的识别结果
      setDocTask((prev) => {
        if (!prev) return prev;
        const nextResults = [...prev.results];
        if (index < nextResults.length) {
          nextResults[index] = { ...nextResults[index], result: newResult };
        }
        return { ...prev, results: nextResults };
      });
    } catch (err: any) {
      console.error('重新识别失败:', err.message);
      throw err;
    }
  }, []);

  return (
    <RecognitionContext.Provider
      value={{
        imageTasks,
        addImageTask,
        clearImageTasks,
        docTask,
        startDocTask,
        clearDocTask,
        rerenderDocResult,
        saving,
        saved,
        saveToLibrary,
        activeCount,
      }}
    >
      {children}
    </RecognitionContext.Provider>
  );
}

export function useRecognition() {
  const ctx = useContext(RecognitionContext);
  if (!ctx) {
    throw new Error('useRecognition must be used within RecognitionProvider');
  }
  return ctx;
}