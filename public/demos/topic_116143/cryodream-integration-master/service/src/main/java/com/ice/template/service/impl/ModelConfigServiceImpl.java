package com.ice.template.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.constant.CommonConstant;
import com.ice.template.exception.BusinessException;
import com.ice.template.mapper.ModelConfigMapper;
import com.ice.template.model.dto.modelconfig.ModelConfigQueryRequest;
import com.ice.template.model.dto.modelconfig.ModelConfigTestRequest;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.model.vo.ModelConfigVO;
import com.ice.template.service.ModelConfigService;
import com.ice.template.utils.SqlUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * 模型配置服务实现
 */
@Slf4j
@Service
public class ModelConfigServiceImpl extends ServiceImpl<ModelConfigMapper, ModelConfig> implements ModelConfigService {

    @Override
    public void validModelConfig(ModelConfig modelConfig, boolean add) {
        if (modelConfig == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String name = modelConfig.getName();
        String modelType = modelConfig.getModelType();
        String provider = modelConfig.getProvider();
        String modelName = modelConfig.getModelName();
        if (StringUtils.isAnyBlank(name, modelType, provider, modelName)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "配置名称、模型类型、厂商和模型名称不能为空");
        }
        // 支持的模型类型：chat/llm(对话)、text(文本)、embedding(嵌入)、image(生图)、audio(语音)
        if (!"chat".equals(modelType) && !"llm".equals(modelType) && !"text".equals(modelType) 
            && !"embedding".equals(modelType) && !"image".equals(modelType) && !"audio".equals(modelType)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "模型类型必须为 chat、text、embedding、image 或 audio");
        }
        if (StringUtils.isNotBlank(name) && name.length() > 128) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "配置名称过长");
        }
        if (StringUtils.isNotBlank(provider) && provider.length() > 64) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "厂商标识过长");
        }
        if (StringUtils.isNotBlank(modelName) && modelName.length() > 128) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "模型名称过长");
        }
        Double temperature = modelConfig.getTemperature();
        if (temperature != null && (temperature < 0 || temperature > 2)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "温度范围应在 0 到 2 之间");
        }
        Integer maxTokens = modelConfig.getMaxTokens();
        if (maxTokens != null && maxTokens < 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "最大令牌数不能小于 0");
        }
    }

    @Override
    public QueryWrapper<ModelConfig> getQueryWrapper(ModelConfigQueryRequest modelConfigQueryRequest) {
        QueryWrapper<ModelConfig> queryWrapper = new QueryWrapper<>();
        if (modelConfigQueryRequest == null) {
            return queryWrapper;
        }
        String id = modelConfigQueryRequest.getId();
        String searchText = modelConfigQueryRequest.getSearchText();
        String name = modelConfigQueryRequest.getName();
        String provider = modelConfigQueryRequest.getProvider();
        String modelName = modelConfigQueryRequest.getModelName();
        Boolean enabled = modelConfigQueryRequest.getEnabled();
        String sortField = modelConfigQueryRequest.getSortField();
        String sortOrder = modelConfigQueryRequest.getSortOrder();

        queryWrapper.eq(ObjectUtils.isNotEmpty(id), "id", id);
        queryWrapper.like(StringUtils.isNotBlank(name), "name", name);
        queryWrapper.eq(StringUtils.isNotBlank(modelConfigQueryRequest.getModelType()), "model_type", modelConfigQueryRequest.getModelType());
        queryWrapper.eq(StringUtils.isNotBlank(provider), "provider", provider);
        queryWrapper.like(StringUtils.isNotBlank(modelName), "model_name", modelName);
        queryWrapper.eq(enabled != null, "enabled", Boolean.TRUE.equals(enabled) ? 1 : 0);
        if (StringUtils.isNotBlank(searchText)) {
            queryWrapper.and(qw -> qw.like("name", searchText)
                    .or().like("provider_name", searchText)
                    .or().like("model_name", searchText)
                    .or().like("description", searchText));
        }
        if (SqlUtils.validSortField(sortField)) {
            queryWrapper.orderBy(true, CommonConstant.SORT_ORDER_ASC.equals(sortOrder), sortField);
        } else {
            queryWrapper.orderByDesc("update_time");
        }
        return queryWrapper;
    }

    @Override
    public ModelConfigVO getModelConfigVO(ModelConfig modelConfig) {
        return ModelConfigVO.objToVo(modelConfig);
    }

    @Override
    public List<ModelConfigVO> getModelConfigVOList(List<ModelConfig> modelConfigList) {
        if (modelConfigList == null) {
            return Collections.emptyList();
        }
        return modelConfigList.stream().map(ModelConfigVO::objToVo).collect(Collectors.toList());
    }

    @Override
    public String testModelConfig(ModelConfigTestRequest testRequest) {
        try {
            String baseUrl = testRequest.getBaseUrl();
            String apiKey = testRequest.getApiKey();
            String model = testRequest.getModel();

            if (StringUtils.isBlank(baseUrl) || StringUtils.isBlank(apiKey) || StringUtils.isBlank(model)) {
                return "测试失败：接口地址、API 密钥和模型名称不能为空";
            }

            // 构建测试请求 URL
            String testUrl = baseUrl.endsWith("/") ? baseUrl + "models" : baseUrl + "/models";

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(testUrl))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return "测试成功：API 连接正常";
            } else if (response.statusCode() == 401) {
                return "测试失败：API 密钥无效或已过期";
            } else if (response.statusCode() == 403) {
                return "测试失败：无权访问该 API";
            } else if (response.statusCode() == 404) {
                return "测试失败：接口地址或模型不存在";
            } else {
                return "测试失败：HTTP " + response.statusCode() + " - " + response.body();
            }
        } catch (Exception e) {
            log.error("测试模型配置失败", e);
            return "测试失败：" + e.getMessage();
        }
    }

    @Override
    public List<ModelConfigVO> listEnabledByType(String modelType) {
        if (StringUtils.isBlank(modelType)) {
            return Collections.emptyList();
        }
        QueryWrapper<ModelConfig> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("model_type", modelType);
        queryWrapper.eq("enabled", 1);
        queryWrapper.eq("is_delete", 0);
        queryWrapper.orderByDesc("update_time");
        List<ModelConfig> list = this.list(queryWrapper);
        return getModelConfigVOList(list);
    }

    @Override
    public List<String> fetchRemoteModels(String baseUrl, String apiKey) {
        if (StringUtils.isBlank(baseUrl)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "接口地址不能为空");
        }
        try {
            // 构建 /models 请求 URL（兼容 OpenAI 兼容格式）
            String testUrl = baseUrl.endsWith("/") ? baseUrl + "models" : baseUrl + "/models";

            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(testUrl))
                    .header("Content-Type", "application/json")
                    .GET()
                    .timeout(Duration.ofSeconds(15));

            // 有 API Key 才加 Authorization header（本地 Infinity 不需要）
            if (StringUtils.isNotBlank(apiKey)) {
                requestBuilder.header("Authorization", "Bearer " + apiKey);
            }

            HttpResponse<String> response = client.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("拉取模型列表失败，HTTP {}", response.statusCode());
                throw new BusinessException(ErrorCode.OPERATION_ERROR, 
                    "获取模型列表失败：HTTP " + response.statusCode());
            }

            // 解析 OpenAI 兼容格式：{"data": [{"id": "gpt-4"}, ...]}
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response.body());
            JsonNode data = root.get("data");
            
            if (data == null || !data.isArray()) {
                log.warn("模型列表响应格式异常，无 data 数组字段");
                return Collections.emptyList();
            }

            List<String> models = new ArrayList<>();
            for (JsonNode item : data) {
                JsonNode id = item.get("id");
                if (id != null && id.isTextual()) {
                    models.add(id.asText());
                }
            }
            
            log.info("成功从 {} 拉取到 {} 个模型", baseUrl, models.size());
            return models;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("从远程 API 拉取模型列表失败", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "获取模型列表失败：" + e.getMessage());
        }
    }
}
