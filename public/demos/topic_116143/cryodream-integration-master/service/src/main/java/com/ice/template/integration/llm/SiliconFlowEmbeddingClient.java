package com.ice.template.integration.llm;

import cn.hutool.http.HttpRequest;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.entity.ModelConfig;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * SiliconFlow Embedding 客户端
 */
@Component
public class SiliconFlowEmbeddingClient {

    /**
     * 生成文本的 embedding 向量
     *
     * @param modelConfig 模型配置
     * @param text        输入文本
     * @return embedding 向量数组
     */
    public float[] embed(ModelConfig modelConfig, String text) {
        if (modelConfig == null || StringUtils.isBlank(text)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }

        String baseUrl = StringUtils.defaultIfBlank(modelConfig.getBaseUrl(), "https://api.siliconflow.com/v1");
        String apiKey = modelConfig.getApiKey();
        String modelName = StringUtils.defaultIfBlank(modelConfig.getModelName(), "BAAI/bge-m3");

        // 本地服务（如 Infinity）不需要 API Key，云端服务需要
        String url = buildEmbeddingUrl(baseUrl);
        JSONObject requestBody = new JSONObject();
        requestBody.set("model", modelName);
        requestBody.set("input", text);
        // BGE-M3 默认 1024 维，pgvector 索引限制 2000 维
        if (modelName.contains("bge-m3")) {
            requestBody.set("dimensions", 1024);
        } else {
            requestBody.set("dimensions", 1024);
        }

        try {
            HttpRequest httpRequest = HttpRequest.post(url)
                    .header("Content-Type", "application/json")
                    .body(requestBody.toString())
                    .timeout(30000);
            if (StringUtils.isNotBlank(apiKey)) {
                httpRequest.header("Authorization", "Bearer " + apiKey);
            }
            String response = httpRequest.execute().body();

            System.out.println("[SiliconFlowEmbedding] API响应: " + response);

            // 检查响应是否为有效 JSON
            if (!response.trim().startsWith("{")) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "SiliconFlow API 返回无效响应: " + response);
            }

            JSONObject jsonResponse = JSONUtil.parseObj(response);
            JSONArray data = jsonResponse.getJSONArray("data");
            if (data == null || data.isEmpty()) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "Embedding 返回数据为空");
            }

            JSONObject firstItem = data.getJSONObject(0);
            JSONArray embedding = firstItem.getJSONArray("embedding");
            if (embedding == null || embedding.isEmpty()) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "Embedding 向量为空");
            }

            float[] result = new float[embedding.size()];
            for (int i = 0; i < embedding.size(); i++) {
                result[i] = embedding.getFloat(i);
            }
            return result;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "SiliconFlow Embedding 调用失败: " + e.getMessage());
        }
    }

    /**
     * 批量生成 embedding
     *
     * @param modelConfig 模型配置
     * @param texts       文本列表
     * @return embedding 向量列表
     */
    public List<float[]> embedBatch(ModelConfig modelConfig, List<String> texts) {
        if (modelConfig == null || texts == null || texts.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }

        String baseUrl = StringUtils.defaultIfBlank(modelConfig.getBaseUrl(), "https://api.siliconflow.com/v1");
        String apiKey = modelConfig.getApiKey();
        String modelName = StringUtils.defaultIfBlank(modelConfig.getModelName(), "BAAI/bge-m3");

        // 本地服务（如 Infinity）不需要 API Key，云端服务需要
        String url = buildEmbeddingUrl(baseUrl);
        JSONObject requestBody = new JSONObject();
        requestBody.set("model", modelName);
        requestBody.set("input", texts);
        requestBody.set("dimensions", 1024);

        try {
            HttpRequest httpRequest = HttpRequest.post(url)
                    .header("Content-Type", "application/json")
                    .body(requestBody.toString())
                    .timeout(60000);
            if (StringUtils.isNotBlank(apiKey)) {
                httpRequest.header("Authorization", "Bearer " + apiKey);
            }
            String response = httpRequest.execute().body();

            JSONObject jsonResponse = JSONUtil.parseObj(response);
            JSONArray data = jsonResponse.getJSONArray("data");
            if (data == null || data.isEmpty()) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "Embedding 返回数据为空");
            }

            List<float[]> results = new java.util.ArrayList<>();
            for (int i = 0; i < data.size(); i++) {
                JSONObject item = data.getJSONObject(i);
                JSONArray embedding = item.getJSONArray("embedding");
                float[] vector = new float[embedding.size()];
                for (int j = 0; j < embedding.size(); j++) {
                    vector[j] = embedding.getFloat(j);
                }
                results.add(vector);
            }
            return results;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "SiliconFlow Embedding 批量调用失败: " + e.getMessage());
        }
    }

    private String buildEmbeddingUrl(String baseUrl) {
        String normalized = StringUtils.removeEnd(baseUrl, "/");
        if (normalized.endsWith("/embeddings")) {
            return normalized;
        }
        if (normalized.endsWith("/v1")) {
            return normalized + "/embeddings";
        }
        // Infinity 等本地服务的 URL 已包含完整路径（如 http://localhost:7987）
        // 尝试直接访问 /embeddings，不强制加 /v1 前缀
        return normalized + "/embeddings";
    }
}
