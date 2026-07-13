import { createMockRecognitionProvider } from "./mock-recognition-provider";
import { createQwenRecognitionProvider } from "./qwen-recognition-provider";

export const createRecognitionProvider = () => {
  const provider = process.env.RECOGNITION_PROVIDER ?? "mock";

  if (provider === "mock") {
    return createMockRecognitionProvider();
  }

  if (provider === "qwen") {
    return createQwenRecognitionProvider();
  }

  throw new Error(`暂不支持的识别服务：${provider}`);
};
