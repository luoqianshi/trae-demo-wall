package com.ice.template.rag.retrieval;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.integration.llm.OpenAiChatMessage;
import com.ice.template.integration.llm.OpenAiCompatibleClient;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.service.ModelConfigService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;

/**
 * 意图重构服务：将用户模糊提问翻译为标准 JSON 查询条件。
 * 采用全自动隐式补全策略——缺失条件后台自动补默认值，不触发反问。
 */
@Service
public class QueryRewriterService {

    private static final Logger log = LoggerFactory.getLogger(QueryRewriterService.class);

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    @Resource
    private ModelConfigService modelConfigService;

    private static final String REWRITE_PROMPT = """
            你是一个情报检索意图分析助手。请把用户的模糊提问，翻译为标准 JSON 检索条件。

            用户提问：
            {{QUERY}}

            请输出如下 JSON（只输出 JSON，不要解释）：
            {
                "time_range": "时间窗口，可选值: last_week / last_month / last_3_months / last_year / all，无法判断时填 last_3_months",
                "domains": ["相关领域，如 自媒体/投资理财/AI技术，无法判断时填空数组"],
                "entities": ["提问中涉及的具体人名/机构/产品，无则空数组"],
                "concepts": ["提问中涉及的抽象概念/方法论，无则空数组"],
                "claim_types": ["断言类型，可选 事实陈述/观点预测，无法判断时填空数组"],
                "min_confidence": 最低置信度0~1的小数，无特殊要求时填0,
                "top_k": 返回条数整数，无特殊要求时填10,
                "semantic_query": "把口语化提问改写为更适合语义检索的简洁陈述句"
            }

            注意：
            1. 必须输出合法 JSON
            2. 不确定的字段用上面的默认值，不要遗漏字段
            3. semantic_query 要保留提问的核心意图
            """;

    /**
     * 重构查询：调用 LLM 生成 JSON 查询条件，失败时回退为仅向量检索的默认查询。
     *
     * @param query         用户原始提问
     * @param modelConfigId 指定的 LLM 模型配置 ID，为空则自动兜底
     */
    public RewrittenQuery rewrite(String query, String modelConfigId) {
        RewrittenQuery fallback = buildDefaultQuery(query);
        if (StringUtils.isBlank(query)) {
            return fallback;
        }
        ModelConfig modelConfig = resolveLlmModel(modelConfigId);
        if (modelConfig == null) {
            log.warn("[QueryRewriter] 无可用 LLM 模型，回退为默认查询（仅向量检索）");
            return fallback;
        }
        try {
            List<OpenAiChatMessage> messages = new ArrayList<>();
            messages.add(new OpenAiChatMessage("system", "你是一个严谨的情报检索意图分析助手，只输出 JSON。"));
            messages.add(new OpenAiChatMessage("user", REWRITE_PROMPT.replace("{{QUERY}}", query)));
            String response = openAiCompatibleClient.chat(modelConfig, messages, 0.1, null);
            String json = extractJson(response);
            JSONObject obj = JSONUtil.parseObj(json);
            RewrittenQuery result = new RewrittenQuery();
            result.setOriginalQuery(query);
            result.setTimeRange(StringUtils.defaultIfBlank(obj.getStr("time_range"), "last_3_months"));
            result.setDomains(toStringList(obj.getJSONArray("domains")));
            result.setEntities(toStringList(obj.getJSONArray("entities")));
            result.setConcepts(toStringList(obj.getJSONArray("concepts")));
            result.setClaimTypes(toStringList(obj.getJSONArray("claim_types")));
            result.setMinConfidence(obj.getDouble("min_confidence", 0.0));
            result.setTopK(obj.getInt("top_k", 10));
            result.setSemanticQuery(StringUtils.defaultIfBlank(obj.getStr("semantic_query"), query));
            normalize(result);
            log.info("[QueryRewriter] 意图重构成功: timeRange={}, domains={}, topK={}",
                    result.getTimeRange(), result.getDomains(), result.getTopK());
            return result;
        } catch (Exception e) {
            log.error("[QueryRewriter] 意图重构失败，回退默认查询: {}", e.getMessage());
            return fallback;
        }
    }

    private RewrittenQuery buildDefaultQuery(String query) {
        RewrittenQuery q = new RewrittenQuery();
        q.setOriginalQuery(query);
        q.setSemanticQuery(query);
        q.setTimeRange("last_3_months");
        q.setTopK(10);
        q.setMinConfidence(0.0);
        return q;
    }

    private void normalize(RewrittenQuery q) {
        if (q.getTopK() <= 0 || q.getTopK() > 50) {
            q.setTopK(10);
        }
        if (q.getMinConfidence() < 0 || q.getMinConfidence() > 1) {
            q.setMinConfidence(0.0);
        }
        if (StringUtils.isBlank(q.getTimeRange())) {
            q.setTimeRange("last_3_months");
        }
        if (StringUtils.isBlank(q.getSemanticQuery())) {
            q.setSemanticQuery(q.getOriginalQuery());
        }
    }

    private ModelConfig resolveLlmModel(String modelConfigId) {
        if (StringUtils.isNotBlank(modelConfigId)) {
            ModelConfig mc = modelConfigService.getById(modelConfigId);
            if (mc != null) {
                return mc;
            }
        }
        List<ModelConfig> enabledLlms = modelConfigService.list().stream()
                .filter(mc -> Integer.valueOf(1).equals(mc.getEnabled())
                        && "llm".equalsIgnoreCase(mc.getModelType())
                        && StringUtils.isNotBlank(mc.getBaseUrl()))
                .toList();
        return enabledLlms.stream()
                .filter(mc -> StringUtils.isNotBlank(mc.getApiKey()))
                .findFirst()
                .orElse(enabledLlms.stream().findFirst().orElse(null));
    }

    private List<String> toStringList(JSONArray array) {
        List<String> list = new ArrayList<>();
        if (array == null) {
            return list;
        }
        for (Object item : array) {
            if (item != null && StringUtils.isNotBlank(item.toString())) {
                list.add(item.toString().trim());
            }
        }
        return list;
    }

    private String extractJson(String response) {
        if (StringUtils.isBlank(response)) {
            return "{}";
        }
        String trimmed = response.trim();
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.replaceAll("```json", "").replaceAll("```", "").trim();
        }
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return "{}";
    }
}
