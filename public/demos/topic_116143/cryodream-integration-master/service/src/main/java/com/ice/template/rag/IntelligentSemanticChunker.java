package com.ice.template.rag;

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
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * 智能语义分块器
 * 使用 LLM 识别语义边界进行分块，而不是简单的字符数切分
 */
@Component
public class IntelligentSemanticChunker {

    private static final Logger log = LoggerFactory.getLogger(IntelligentSemanticChunker.class);

    @Resource
    private OpenAiCompatibleClient openAiCompatibleClient;

    @Resource
    private ModelConfigService modelConfigService;

    @Resource
    private StructuredJsonOutputRepairer structuredJsonOutputRepairer;


    private static final String CHUNKING_PROMPT = """
            请把下面文档按语义切分为父子块，并抽取每个子块的知识元数据。只输出合法 JSON。

            文档内容：
            {{DOCUMENT_CONTENT}}

            可参考实体：
            {{GLOBAL_ENTITIES}}

            === 父子块黄金比例（必须遵守）===
            A. 短文策略（全文 ≤ 500 字）：强制输出 1 个父块 + 2~4 个子块。父块覆盖全文，子块按自然段切分。
            B. 中长文（500~2000 字）：输出 1~2 个父块，每个父块下 2~4 个子块。
            C. 长文（>2000 字）：按大主题拆成多个父块，每个父块下 2~5 个子块。
            D. 子块大小：150~250 字符为佳（最小不低于 80 字符，最大不超过 400 字符）。优先在双换行符（段落边界）处切分，绝不在句子中间切断。
            E. 重叠率：相邻子块可重叠 20~30 字符（首尾衔接），防止切断关键名词或因果关系。
            F. 父块摘要 = 结构化摘要，必须包含"（详见子块N）"指针。

            要求：
            1. domain 和 theme 必须根据全文内容填写，不能写未知、未分类、空字符串
            2. parent 表示大主题聚合块，children 表示其下的语义子块；短文只需 1 个 parent 覆盖全文
            3. 每个 child.text 必须从原文复制，不要改写；所有 child.text 拼接后必须等于原文
            4. 每个 child 必须抽取 entities 和 concepts，若原文确实没有专有实体，entities 可以为空，但 concepts 至少 1 个
            5. entities 使用 {"name":"名称","description":"说明"}；当前 child.text 中出现的人物、组织、产品、地点必须进入 entities
            6. events 中的 subject 必须进入当前 child.entities；events 中的 object 如果是人物、组织、产品、地点，也必须进入当前 child.entities
            7. 可参考实体是全局实体候选库，若 child.text 中出现简称或别名（如“马斯克”对应“埃隆·马斯克”），entities 应使用全局实体的规范名称；但只有当前 child.text 明确出现名称、简称或别名时才允许补入，禁止无证据继承全文实体
            8. concepts 使用 {"name":"概念","description":"说明"}
            9. 每个 child 必须尽量抽取 events，格式为 {"subject":"主语","action":"动作","object":"对象","result":"结果","event_time":"事件发生时间，未明确则留空","assertion_time":"信息发布时间或断言时间，未明确则留空","event_type":"事件类型","causal_role":"cause/effect/evidence/background/unknown","evidence":"原文短句"}
            10. event_time 是事件自身发生时间，assertion_time 是文本发布、记录、引用或断言该事件的时间，两者不能混用
            11. 如果 child 中出现人物/组织/概念之间的动作、因果、应用、导致、提出、解决、影响关系，events 不能为空
            12. 每个 event 必须能被当前 child.text 直接支撑；不要把其他 chunk 或全文级事件塞进当前 child
            13. chunk_summary 必须概括该子块内容，不能为空
            14. **关键：parent_summary 必须是结构化摘要**，格式为：先一句话概括本段主题，然后用分句逐一说明本段讨论了哪些子话题，并用"（详见子块N）"标注信息来源。示例："本段讨论了星辉电池的技术突破与量产挑战。技术层面，能量密度提升至 300Wh/kg（详见子块1），快充循环寿命达 2000 次（详见子块2）；量产层面，成本较上代增加 15%（详见子块3），良率仅 65% 有待改善（详见子块4）。"
            15. 不要输出 Markdown，不要输出解释，只输出 JSON

            输出格式：
            {
              "domain": "领域",
              "theme": "主题",
              "parents": [
                {
                  "parent_index": 0,
                  "parent_summary": "结构化摘要，用（详见子块N）标注来源",
                  "children": [
                    {
                      "index": 0,
                      "text": "子块原文（从原文复制，150~250字符，按段落边界切分）",
                      "entities": [{"name":"实体名","description":"实体说明"}],
                      "concepts": [{"name":"概念名","description":"概念说明"}],
                      "claim_type": "事实陈述",
                      "source": "document",
                      "confidence": 0.8,
                      "chunk_summary": "子块摘要",
                      "events": [{"subject":"主语","action":"动作","object":"对象","result":"结果","event_time":"事件发生时间，未明确则留空","assertion_time":"信息发布时间或断言时间，未明确则留空","event_type":"事件类型","causal_role":"cause/effect/evidence/background/unknown","evidence":"原文短句"}]
                    }
                  ]
                }
              ]
            }
            """;

    private static final String PLAIN_CHUNKING_PROMPT = """
            你是一个专业的文本分块助手。请阅读以下完整文档，按照语义边界进行分块。

            文档内容：
            {{DOCUMENT_CONTENT}}

            分块要求：
            1. 按照自然的语义边界切分（段落转换、话题切换、论点变化）
            2. 每个块应该是一个完整的语义单元，包含一个完整的观点或信息
            3. 绝对不能在句子中间或因果关系中间切分
            4. 每个块的大小应该在 300-1000 字符之间
            5. 保持原文的完整性，不要修改、省略或截断任何内容
            6. 所有块的文本拼接起来必须等于完整原文，不能遗漏任何内容

            只需输出分块结果，不需要任何元数据标注。

            输出格式（有效 JSON）：
            {
                "chunks": [
                    {"index": 0, "text": "第一个语义块的完整原文..."},
                    {"index": 1, "text": "第二个语义块的完整原文..."}
                ]
            }

            注意：
            1. text 字段必须从原文中完整复制，不能修改、省略或截断
            2. 所有 chunks 的 text 拼接起来必须等于完整原文
            3. 输出必须是有效的 JSON 格式
            """;

    private static final String PLAIN_CHUNKING_JSON_SCHEMA = """
            {
              "chunks": [
                {"index": 0, "text": "语义块完整原文"}
              ]
            }
            """;

    private static final String COGNITIVE_CHUNKING_JSON_SCHEMA = """
            {
              "domain": "领域",
              "theme": "主题",
              "parents": [
                {
                  "parent_index": 0,
                  "parent_summary": "结构化摘要，用（详见子块N）标注来源",
                  "children": [
                    {
                      "index": 0,
                      "text": "子块原文（150~250字符，按段落边界切分）",
                      "entities": [{"name":"实体名","description":"实体说明"}],
                      "concepts": [{"name":"概念名","description":"概念说明"}],
                      "claim_type": "事实陈述",
                      "source": "document",
                      "confidence": 0.8,
                      "chunk_summary": "子块摘要",
                      "events": [{"subject":"主语","action":"动作","object":"对象","result":"结果","event_time":"事件发生时间","assertion_time":"信息发布时间或断言时间","event_type":"事件类型","causal_role":"cause/effect/evidence/background/unknown","evidence":"原文短句"}]
                    }
                  ]
                }
              ]
            }
            """;

    public List<ChunkInfo> chunkPlain(String text, JSONObject baseMetadata, String modelConfigId) {
        if (StringUtils.isBlank(text)) {
            return new ArrayList<>();
        }
        String metadataStr = baseMetadata != null ? baseMetadata.toString() : "{}";

        if (text.length() < 500) {
            ChunkInfo chunk = new ChunkInfo();
            chunk.setChunkIndex(0);
            chunk.setChunkText(text);
            chunk.setRawText(text);
            chunk.setSemanticBoundary("完整文档");
            chunk.setMetadata(metadataStr);
            List<ChunkInfo> single = new ArrayList<>();
            single.add(chunk);
            return single;
        }

        ModelConfig modelConfig = StringUtils.isNotBlank(modelConfigId) ? modelConfigService.getById(modelConfigId) : null;
        if (StringUtils.isNotBlank(modelConfigId) && modelConfig == null) {
            log.warn("[IntelligentSemanticChunker] 普通分块模型配置不存在: {}", modelConfigId);
        }

        String prompt = PLAIN_CHUNKING_PROMPT.replace("{{DOCUMENT_CONTENT}}", text);
        List<OpenAiChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiChatMessage("system", "你是一个专业的文本分块助手，请严格按照要求只输出分块 JSON。text 字段必须从原文完整复制，不能截断，也不要输出任何元数据。"));
        messages.add(new OpenAiChatMessage("user", prompt));

        try {
            String response = openAiCompatibleClient.chat(modelConfig, messages, 0.1, null);
            JSONObject result = structuredJsonOutputRepairer.parseOrRepairObject("普通语义分块", PLAIN_CHUNKING_JSON_SCHEMA, prompt, response, modelConfig);
            JSONArray chunksArray = result.getJSONArray("chunks");
            List<ChunkInfo> chunks = new ArrayList<>();
            for (int i = 0; i < chunksArray.size(); i++) {
                JSONObject chunkObj = chunksArray.getJSONObject(i);
                String chunkText = chunkObj.getStr("text");
                if (StringUtils.isBlank(chunkText)) {
                    continue;
                }
                ChunkInfo chunk = new ChunkInfo();
                chunk.setChunkIndex(i);
                chunk.setChunkText(chunkText);
                chunk.setRawText(chunkText);
                chunk.setSemanticBoundary("LLM 语义边界");
                chunk.setMetadata(metadataStr);
                chunks.add(chunk);
            }
            validateChunks(chunks, text);
            log.info("[IntelligentSemanticChunker] 普通 LLM 分块完成，共 {} 个块（轻量元数据）", chunks.size());
            return chunks;
        } catch (Exception e) {
            log.error("[IntelligentSemanticChunker] 普通 LLM 分块失败: {}", e.getMessage());
            throw new RuntimeException("普通 LLM 分块失败: " + e.getMessage(), e);
        }
    }

    /**
     * 使用 LLM 进行智能语义分块（认知级：携带完整三维背包元数据）
     */
    public List<ChunkInfo> chunk(String text, JSONObject globalMetadata, String modelConfigId) {
        if (StringUtils.isBlank(text)) {
            return new ArrayList<>();
        }

        ModelConfig modelConfig = null;
        if (StringUtils.isNotBlank(modelConfigId)) {
            modelConfig = modelConfigService.getById(modelConfigId);
        }
        if (modelConfig == null) {
            throw new RuntimeException("认知级分块必须指定有效的 LLM 模型配置（modelConfigId=" + modelConfigId + "），请在模型设置中配置一个带 API Key 的 LLM 模型");
        }
        log.info("[IntelligentSemanticChunker] 使用模型: {} ({}), provider={}", 
            modelConfig.getName(), modelConfig.getModelName(), modelConfig.getProvider());

        // 直接把完整原文发给 LLM；注入可对齐的全局实体库
        String prompt = CHUNKING_PROMPT
                .replace("{{DOCUMENT_CONTENT}}", text)
                .replace("{{GLOBAL_ENTITIES}}", buildGlobalEntitiesText(globalMetadata));

        List<OpenAiChatMessage> messages = new ArrayList<>();
        messages.add(new OpenAiChatMessage("system", "你是文本语义分块助手。只输出合法 JSON，不输出解释。"));
        messages.add(new OpenAiChatMessage("user", prompt));

        try {
            String response = openAiCompatibleClient.chat(modelConfig, messages, 0.1, null);
            log.info("[IntelligentSemanticChunker] LLM 返回分块结果，长度: {}", response.length());
            log.debug("[IntelligentSemanticChunker] LLM 原始返回（前500字符）: {}", response.length() > 500 ? response.substring(0, 500) : response);

            JSONObject result = structuredJsonOutputRepairer.parseOrRepairObject("认知级语义分块", COGNITIVE_CHUNKING_JSON_SCHEMA, prompt, response, modelConfig);

            String llmDomain = result.getStr("domain");
            String llmTheme = result.getStr("theme");
            String domain = StringUtils.isNotBlank(llmDomain) ? llmDomain : resolveDomain(globalMetadata);
            String theme = StringUtils.isNotBlank(llmTheme) ? llmTheme : resolveTheme(globalMetadata);

            JSONArray parentsArray = result.getJSONArray("parents");
            // 兼容旧结构：若 LLM 仍返回扁平 chunks，则降级为「单父块 + 这些子块」
            if (parentsArray == null || parentsArray.isEmpty()) {
                log.warn("[IntelligentSemanticChunker] LLM 未返回 parents 数组，解析后的 JSON keys: {}", result.keySet());
                JSONArray flatChunks = result.getJSONArray("chunks");
                if (flatChunks != null && !flatChunks.isEmpty()) {
                    log.warn("[IntelligentSemanticChunker] LLM 未返回父子结构，降级为扁平子块");
                    return parseFlatChunks(flatChunks, domain, theme, text, globalMetadata);
                }
                throw new RuntimeException("LLM 返回的 JSON 结构异常：既无 parents 也无 chunks，解析后的 JSON keys=" + result.keySet());
            }

            JSONArray globalEntities = resolveGlobalEntities(globalMetadata);
            JSONArray globalConcepts = resolveGlobalConcepts(globalMetadata);
            JSONArray globalEvents = resolveGlobalEvents(globalMetadata);
            List<ChunkInfo> chunks = new ArrayList<>();
            int childGlobalIndex = 0;
            for (int p = 0; p < parentsArray.size(); p++) {
                JSONObject parentObj = parentsArray.getJSONObject(p);
                JSONArray childrenArray = parentObj.getJSONArray("children");
                if (childrenArray == null || childrenArray.isEmpty()) {
                    continue;
                }

                // 解析子块，同时拼出父块文本
                List<ChunkInfo> childInfos = new ArrayList<>();
                StringBuilder parentText = new StringBuilder();
                String parentLocalId = "parent_" + p;
                for (int c = 0; c < childrenArray.size(); c++) {
                    JSONObject childObj = childrenArray.getJSONObject(c);
                    String childText = childObj.getStr("text");
                    if (StringUtils.isBlank(childText)) {
                        continue;
                    }
                    parentText.append(childText);

                    ChunkInfo child = new ChunkInfo();
                    child.setChunkIndex(childGlobalIndex++);
                    child.setChunkText(childText);
                    child.setRawText(childText);
                    child.setChunkLevel("child");
                    child.setParentLocalId(parentLocalId);
                    child.setDomain(domain);
                    child.setTheme(theme);
                    child.setEventId(null);
                    Object entitiesObj = childObj.get("entities");
                    child.setEntities(resolveChunkItems(entitiesObj, globalEntities, childText).toString());
                    Object conceptsObj = childObj.get("concepts");
                    child.setConcepts(resolveChunkItems(conceptsObj, globalConcepts, childText).toString());
                    Object eventsObj = childObj.get("events");
                    child.setEvents(resolveChunkEvents(eventsObj, globalEvents, childText, child.getEntities(), child.getConcepts()).toString());
                    child.setEntities(enrichEntitiesFromEvents(child.getEntities(), child.getEvents(), globalEntities, childText).toString());
                    // 3_Epistemology_Tag
                    child.setClaimType(childObj.getStr("claim_type", "事实陈述"));
                    child.setConfidence(childObj.getDouble("confidence", 0.8));
                    child.setSource(childObj.getStr("source", "document"));
                    child.setChunkSummary(childObj.getStr("chunk_summary", ""));
                    child.setMetadata(buildChunkMetadata(child));
                    childInfos.add(child);
                }
                if (childInfos.isEmpty()) {
                    continue;
                }

                String parentSummary = StringUtils.defaultIfBlank(parentObj.getStr("parent_summary"), StringUtils.abbreviate(parentText.toString(), 500));
                ChunkInfo parent = new ChunkInfo();
                parent.setChunkIndex(p);
                parent.setChunkText(parentSummary);
                parent.setRawText(parentText.toString());
                parent.setChunkLevel("parent");
                parent.setParentLocalId(parentLocalId);  // 复用该字段作为「父块自身的本地标识」，供子块映射
                parent.setDomain(domain);
                parent.setTheme(theme);
                parent.setEntities("[]");
                parent.setConcepts("[]");
                parent.setEvents(aggregateEvents(childInfos).toString());
                parent.setClaimType("段落聚合");
                parent.setConfidence(1.0);
                parent.setSource("parent");
                parent.setChunkSummary(parentSummary);
                parent.setMetadata(buildChunkMetadata(parent));

                chunks.add(parent);
                chunks.addAll(childInfos);
            }

            if (chunks.isEmpty()) {
                throw new RuntimeException("LLM 返回的分块结果为空，parents 数组中无有效子块");
            }

            // 仅用子块文本拼接校验覆盖率（父块是子块聚合，不重复计入）
            List<ChunkInfo> childrenOnly = chunks.stream().filter(ci -> "child".equals(ci.getChunkLevel())).toList();
            double coverage = validateChunks(childrenOnly, text);

            // 覆盖率严重不足（< 60%），说明 LLM 输出被截断，fallback 到规则分块
            if (coverage < 0.6) {
                log.warn("[IntelligentSemanticChunker] LLM 分块覆盖率仅 {}%，疑似输出截断，fallback 到规则分块", String.format("%.1f", coverage * 100));
                return fallbackRuleBasedChunk(text, globalMetadata);
            }

            long parentCount = chunks.stream().filter(ci -> "parent".equals(ci.getChunkLevel())).count();
            log.info("[IntelligentSemanticChunker] 父子块分块完成：父块 {} 个，子块 {} 个", parentCount, childrenOnly.size());
            return chunks;

        } catch (Exception e) {
            log.error("[IntelligentSemanticChunker] LLM 分块失败: {}", e.getMessage());
            throw new RuntimeException("LLM 语义分块失败: " + e.getMessage(), e);
        }
    }

    private String resolveDomain(JSONObject globalMetadata) {
        if (globalMetadata == null) {
            return "未分类";
        }
        String domain = globalMetadata.getStr("domain");
        if (StringUtils.isNotBlank(domain)) {
            return domain;
        }
        JSONObject domainScope = globalMetadata.getJSONObject("1_Domain_Scope");
        if (domainScope != null) {
            domain = domainScope.getStr("domain");
            if (StringUtils.isNotBlank(domain)) {
                return domain;
            }
        }
        return "未分类";
    }

    private String resolveTheme(JSONObject globalMetadata) {
        if (globalMetadata == null) {
            return "未知主题";
        }
        String theme = globalMetadata.getStr("theme");
        if (StringUtils.isNotBlank(theme)) {
            return theme;
        }
        JSONObject domainScope = globalMetadata.getJSONObject("1_Domain_Scope");
        if (domainScope != null) {
            theme = domainScope.getStr("theme");
            if (StringUtils.isNotBlank(theme)) {
                return theme;
            }
        }
        return "未知主题";
    }

    private JSONArray resolveGlobalEntities(JSONObject globalMetadata) {
        if (globalMetadata == null) {
            return new JSONArray();
        }
        Object entities = globalMetadata.get("entities");
        if (entities instanceof JSONArray arr) {
            return arr;
        }
        JSONObject ontology = globalMetadata.getJSONObject("2_Ontology_Routing");
        if (ontology != null) {
            Object ontologyEntities = ontology.get("entities");
            if (ontologyEntities instanceof JSONArray arr) {
                return arr;
            }
        }
        return new JSONArray();
    }

    private JSONArray resolveGlobalConcepts(JSONObject globalMetadata) {
        if (globalMetadata == null) {
            return new JSONArray();
        }
        Object concepts = globalMetadata.get("concepts");
        if (concepts instanceof JSONArray arr) {
            return arr;
        }
        JSONObject ontology = globalMetadata.getJSONObject("2_Ontology_Routing");
        if (ontology != null) {
            Object ontologyConcepts = ontology.get("concepts");
            if (ontologyConcepts instanceof JSONArray arr) {
                return arr;
            }
        }
        return new JSONArray();
    }

    private JSONArray resolveGlobalEvents(JSONObject globalMetadata) {
        if (globalMetadata == null) {
            return new JSONArray();
        }
        Object events = globalMetadata.get("events");
        if (events instanceof JSONArray arr) {
            return arr;
        }
        JSONObject ontology = globalMetadata.getJSONObject("2_Ontology_Routing");
        if (ontology != null) {
            Object ontologyEvents = ontology.get("events");
            if (ontologyEvents instanceof JSONArray arr) {
                return arr;
            }
        }
        return new JSONArray();
    }

    private String buildGlobalEntitiesText(JSONObject globalMetadata) {
        JSONArray arr = resolveGlobalEntities(globalMetadata);
        if (arr.isEmpty()) {
            return "（无，请自行规范化命名）";
        }
        List<String> names = new ArrayList<>();
        for (int i = 0; i < arr.size(); i++) {
            JSONObject e = arr.getJSONObject(i);
            String name = e.getStr("name");
            if (StringUtils.isNotBlank(name)) {
                names.add(name);
            }
        }
        return names.isEmpty() ? "（无，请自行规范化命名）" : JSONUtil.toJsonStr(names);
    }

    /** 兼容降级：LLM 仍返回扁平 chunks 时，包成「单父块 + 子块」结构。 */
    private List<ChunkInfo> parseFlatChunks(JSONArray flatChunks, String domain, String theme, String originalText, JSONObject globalMetadata) {
        JSONArray globalEntities = resolveGlobalEntities(globalMetadata);
        JSONArray globalConcepts = resolveGlobalConcepts(globalMetadata);
        JSONArray globalEvents = resolveGlobalEvents(globalMetadata);
        List<ChunkInfo> result = new ArrayList<>();
        List<ChunkInfo> childInfos = new ArrayList<>();
        StringBuilder parentText = new StringBuilder();
        String parentLocalId = "parent_0";
        for (int i = 0; i < flatChunks.size(); i++) {
            JSONObject chunkObj = flatChunks.getJSONObject(i);
            String chunkText = chunkObj.getStr("text");
            if (StringUtils.isBlank(chunkText)) {
                continue;
            }
            parentText.append(chunkText);
            ChunkInfo child = new ChunkInfo();
            child.setChunkIndex(i);
            child.setChunkText(chunkText);
            child.setRawText(chunkText);
            child.setChunkLevel("child");
            child.setParentLocalId(parentLocalId);
            child.setDomain(domain);
            child.setTheme(theme);
            Object entitiesObj = chunkObj.get("entities");
            child.setEntities(resolveChunkItems(entitiesObj, globalEntities, chunkText).toString());
            Object conceptsObj = chunkObj.get("concepts");
            child.setConcepts(resolveChunkItems(conceptsObj, globalConcepts, chunkText).toString());
            Object eventsObj = chunkObj.get("events");
            child.setEvents(resolveChunkEvents(eventsObj, globalEvents, chunkText, child.getEntities(), child.getConcepts()).toString());
            child.setEntities(enrichEntitiesFromEvents(child.getEntities(), child.getEvents(), globalEntities, chunkText).toString());
            child.setClaimType(chunkObj.getStr("claim_type", "事实陈述"));
            child.setConfidence(chunkObj.getDouble("confidence", 0.8));
            child.setSource(chunkObj.getStr("source", "document"));
            child.setChunkSummary(chunkObj.getStr("chunk_summary", ""));
            child.setMetadata(buildChunkMetadata(child));
            childInfos.add(child);
        }
        if (childInfos.isEmpty()) {
            return result;
        }
        ChunkInfo parent = new ChunkInfo();
        parent.setChunkIndex(0);
        parent.setChunkText(StringUtils.abbreviate(parentText.toString(), 500));
        parent.setRawText(parentText.toString());
        parent.setChunkLevel("parent");
        parent.setParentLocalId(parentLocalId);
        parent.setDomain(domain);
        parent.setTheme(theme);
        parent.setEntities("[]");
        parent.setConcepts("[]");
        parent.setEvents(aggregateEvents(childInfos).toString());
        parent.setClaimType("段落聚合");
        parent.setConfidence(1.0);
        parent.setSource("parent");
        parent.setChunkSummary("");
        parent.setMetadata(buildChunkMetadata(parent));
        result.add(parent);
        result.addAll(childInfos);
        validateChunks(childInfos, originalText);
        return result;
    }

    private JSONArray resolveChunkEvents(Object eventsObj, JSONArray globalEvents, String chunkText, String entitiesJson, String conceptsJson) {
        JSONArray localEvents = eventsObj instanceof JSONArray eventsArray ? normalizeEvents(eventsArray, chunkText, true) : new JSONArray();
        if (!localEvents.isEmpty()) {
            return localEvents;
        }
        JSONArray matchedGlobalEvents = normalizeEvents(globalEvents, chunkText, true);
        if (!matchedGlobalEvents.isEmpty()) {
            return matchedGlobalEvents;
        }
        return inferEventsFromChunkText(chunkText, entitiesJson, conceptsJson);
    }

    private JSONArray resolveChunkItems(Object localObj, JSONArray globalItems, String chunkText) {
        JSONArray localItems = localObj instanceof JSONArray localArray ? filterItemsByChunkText(localArray, chunkText) : new JSONArray();
        if (!localItems.isEmpty()) {
            return localItems;
        }
        return filterItemsByChunkText(globalItems, chunkText);
    }

    private JSONArray enrichEntitiesFromEvents(String entitiesJson, String eventsJson, JSONArray globalEntities, String chunkText) {
        JSONArray result = parseArraySafely(entitiesJson);
        if (StringUtils.isBlank(eventsJson)) {
            return result;
        }
        JSONArray events = parseArraySafely(eventsJson);
        for (Object item : events) {
            if (item instanceof JSONObject event) {
                addGlobalEntityFromParticipant(result, event.getStr("subject"), globalEntities, chunkText);
                addGlobalEntityFromParticipant(result, event.getStr("object"), globalEntities, chunkText);
            }
        }
        return result;
    }

    private JSONArray parseArraySafely(String json) {
        if (StringUtils.isBlank(json)) {
            return new JSONArray();
        }
        try {
            return JSONUtil.parseArray(json);
        } catch (Exception ignored) {
            return new JSONArray();
        }
    }

    private void addGlobalEntityFromParticipant(JSONArray result, String participant, JSONArray globalEntities, String chunkText) {
        if (StringUtils.isBlank(participant)) {
            return;
        }
        JSONObject globalEntity = findGlobalEntityByParticipant(participant, globalEntities, chunkText);
        if (globalEntity != null) {
            addEntityIfAbsent(result, globalEntity);
        }
    }

    private JSONObject findGlobalEntityByParticipant(String participant, JSONArray globalEntities, String chunkText) {
        if (globalEntities == null || globalEntities.isEmpty() || StringUtils.isBlank(chunkText)) {
            return null;
        }
        for (Object item : globalEntities) {
            if (item instanceof JSONObject obj) {
                String name = obj.getStr("name");
                if (StringUtils.isNotBlank(name) && isSameEntityName(name, participant) && isItemSupportedByChunk(obj, chunkText)) {
                    return obj;
                }
            }
        }
        return null;
    }

    private boolean isSameEntityName(String canonicalName, String mention) {
        if (containsNormalized(canonicalName, mention) || containsNormalized(mention, canonicalName)) {
            return true;
        }
        for (String alias : buildEntityAliases(canonicalName)) {
            if (containsNormalized(alias, mention) || containsNormalized(mention, alias)) {
                return true;
            }
        }
        return false;
    }

    private void addEntityIfAbsent(JSONArray result, JSONObject entity) {
        String name = entity.getStr("name");
        if (StringUtils.isBlank(name)) {
            return;
        }
        for (Object item : result) {
            if (item instanceof JSONObject obj && name.equals(obj.getStr("name"))) {
                return;
            }
        }
        result.add(entity);
    }

    private List<String> buildEntityAliases(String name) {
        List<String> aliases = new ArrayList<>();
        if (StringUtils.isBlank(name)) {
            return aliases;
        }
        if (name.contains("·")) {
            String alias = name.substring(name.lastIndexOf("·") + 1);
            if (StringUtils.isNotBlank(alias)) {
                aliases.add(alias);
            }
        }
        return aliases;
    }

    private JSONArray filterItemsByChunkText(JSONArray items, String chunkText) {
        JSONArray result = new JSONArray();
        if (items == null || items.isEmpty() || StringUtils.isBlank(chunkText)) {
            return result;
        }
        for (Object item : items) {
            if (item instanceof JSONObject obj) {
                String name = obj.getStr("name");
                if (StringUtils.isNotBlank(name) && isItemSupportedByChunk(obj, chunkText)) {
                    result.add(obj);
                }
            }
        }
        return result;
    }

    private boolean isItemSupportedByChunk(JSONObject item, String chunkText) {
        String name = item.getStr("name");
        if (containsNormalized(chunkText, name)) {
            return true;
        }
        for (String alias : buildEntityAliases(name)) {
            if (containsNormalized(chunkText, alias)) {
                return true;
            }
        }
        return false;
    }

    private JSONArray normalizeEvents(JSONArray events, String chunkText, boolean requireSupport) {
        JSONArray result = new JSONArray();
        if (events == null || events.isEmpty()) {
            return result;
        }
        for (Object item : events) {
            if (item instanceof JSONObject event && (!requireSupport || isEventSupportedByChunk(event, chunkText))) {
                result.add(normalizeEvent(event, chunkText));
            }
        }
        return result;
    }

    private JSONObject normalizeEvent(JSONObject event, String chunkText) {
        JSONObject normalized = new JSONObject();
        normalized.set("subject", event.getStr("subject", ""));
        normalized.set("action", event.getStr("action", ""));
        normalized.set("object", event.getStr("object", ""));
        normalized.set("result", event.getStr("result", ""));
        normalized.set("event_time", event.getStr("event_time", ""));
        normalized.set("assertion_time", event.getStr("assertion_time", ""));
        normalized.set("event_type", StringUtils.defaultIfBlank(event.getStr("event_type"), inferEventType(event.getStr("action", ""))));
        normalized.set("causal_role", StringUtils.defaultIfBlank(event.getStr("causal_role"), "unknown"));
        normalized.set("evidence", StringUtils.defaultIfBlank(event.getStr("evidence"), findEvidence(chunkText, event)));
        return normalized;
    }

    private boolean isEventSupportedByChunk(JSONObject event, String chunkText) {
        if (StringUtils.isBlank(chunkText)) {
            return false;
        }
        String evidence = event.getStr("evidence", "");
        if (StringUtils.isNotBlank(evidence) && (containsNormalized(chunkText, evidence) || containsNormalized(evidence, chunkText))) {
            return true;
        }
        int score = 0;
        if (containsNormalized(chunkText, event.getStr("subject", ""))) {
            score++;
        }
        if (containsNormalized(chunkText, event.getStr("action", ""))) {
            score++;
        }
        if (containsNormalized(chunkText, event.getStr("object", ""))) {
            score++;
        }
        if (containsNormalized(chunkText, event.getStr("result", ""))) {
            score++;
        }
        return score >= 2;
    }

    private boolean containsNormalized(String text, String keyword) {
        if (StringUtils.isBlank(text) || StringUtils.isBlank(keyword)) {
            return false;
        }
        String normalizedText = text.replaceAll("\\s+", "");
        String normalizedKeyword = keyword.replaceAll("\\s+", "");
        return normalizedText.contains(normalizedKeyword);
    }

    private String findEvidence(String chunkText, JSONObject event) {
        if (StringUtils.isBlank(chunkText)) {
            return "";
        }
        List<String> sentences = splitIntoSentences(chunkText);
        for (String sentence : sentences) {
            if (isEventSupportedBySentence(event, sentence)) {
                return StringUtils.abbreviate(sentence, 120);
            }
        }
        return StringUtils.abbreviate(chunkText, 120);
    }

    private boolean isEventSupportedBySentence(JSONObject event, String sentence) {
        int score = 0;
        if (containsNormalized(sentence, event.getStr("subject", ""))) {
            score++;
        }
        if (containsNormalized(sentence, event.getStr("action", ""))) {
            score++;
        }
        if (containsNormalized(sentence, event.getStr("object", ""))) {
            score++;
        }
        return score >= 2;
    }

    private String inferEventType(String action) {
        if (StringUtils.isBlank(action)) {
            return "unknown";
        }
        if (action.contains("导致") || action.contains("影响") || action.contains("推动")) {
            return "因果影响";
        }
        if (action.contains("提出") || action.contains("解释") || action.contains("证明")) {
            return "观点论证";
        }
        if (action.contains("收购") || action.contains("合作") || action.contains("创办")) {
            return "商业行为";
        }
        return "事件";
    }

    private JSONArray inferEventsFromChunkText(String chunkText, String entitiesJson, String conceptsJson) {
        JSONArray result = new JSONArray();
        if (StringUtils.isBlank(chunkText)) {
            return result;
        }
        String action = inferAction(chunkText);
        if (StringUtils.isBlank(action)) {
            return result;
        }
        String subject = firstNameFromJson(entitiesJson);
        String object = firstNameFromJson(conceptsJson);
        if (StringUtils.isBlank(subject) && StringUtils.isBlank(object)) {
            return result;
        }
        JSONObject event = new JSONObject();
        event.set("subject", StringUtils.isNotBlank(subject) ? subject : "文档主体");
        event.set("action", action);
        event.set("object", StringUtils.isNotBlank(object) ? object : "相关对象");
        event.set("result", buildFallbackSummary(chunkText));
        event.set("event_time", "");
        event.set("assertion_time", "");
        event.set("event_type", inferEventType(action));
        event.set("causal_role", "unknown");
        event.set("evidence", findEvidence(chunkText, event));
        result.add(event);
        return result;
    }

    private String inferAction(String chunkText) {
        String[] actions = {"提出", "应用", "导致", "解决", "重构", "降低", "创办", "影响", "推动", "优化", "解释", "证明", "形成", "改变", "拆解", "删除", "简化", "加速", "自动化"};
        for (String action : actions) {
            if (chunkText.contains(action)) {
                return action;
            }
        }
        return "";
    }

    private String firstNameFromJson(String arrayJson) {
        if (StringUtils.isBlank(arrayJson)) {
            return "";
        }
        try {
            JSONArray arr = JSONUtil.parseArray(arrayJson);
            for (Object item : arr) {
                if (item instanceof JSONObject obj) {
                    String name = obj.getStr("name");
                    if (StringUtils.isNotBlank(name)) {
                        return name;
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return "";
    }

    private JSONArray aggregateEvents(List<ChunkInfo> chunks) {
        JSONArray result = new JSONArray();
        if (chunks == null) {
            return result;
        }
        for (ChunkInfo chunk : chunks) {
            if (chunk == null || StringUtils.isBlank(chunk.getEvents())) {
                continue;
            }
            try {
                JSONArray arr = JSONUtil.parseArray(chunk.getEvents());
                for (Object item : arr) {
                    result.add(item);
                }
            } catch (Exception ignored) {
            }
        }
        return result;
    }

    private String buildChunkMetadata(ChunkInfo chunk) {
        JSONObject metadata3d = new JSONObject();

        // 1_Domain_Scope：所有分块共享
        JSONObject domainScope = new JSONObject();
        domainScope.set("domain", chunk.getDomain() != null ? chunk.getDomain() : "未分类");
        domainScope.set("theme", chunk.getTheme() != null ? chunk.getTheme() : "未知主题");
        metadata3d.set("1_Domain_Scope", domainScope);

        JSONObject ontologyRouting = new JSONObject();
        ontologyRouting.set("chunk_level", chunk.getChunkLevel() != null ? chunk.getChunkLevel() : "child");
        ontologyRouting.set("parent_local_id", chunk.getParentLocalId());
        try {
            ontologyRouting.set("entities", JSONUtil.parseArray(chunk.getEntities() != null ? chunk.getEntities() : "[]"));
        } catch (Exception e) {
            ontologyRouting.set("entities", new JSONArray());
        }
        try {
            ontologyRouting.set("concepts", JSONUtil.parseArray(chunk.getConcepts() != null ? chunk.getConcepts() : "[]"));
        } catch (Exception e) {
            ontologyRouting.set("concepts", new JSONArray());
        }
        try {
            ontologyRouting.set("events", JSONUtil.parseArray(chunk.getEvents() != null ? chunk.getEvents() : "[]"));
        } catch (Exception e) {
            ontologyRouting.set("events", new JSONArray());
        }
        metadata3d.set("2_Ontology_Routing", ontologyRouting);

        // 3_Epistemology_Tag：每个 Chunk 独立
        JSONObject epistemologyTag = new JSONObject();
        epistemologyTag.set("time_stamp", java.time.LocalDate.now().toString());
        epistemologyTag.set("claim_type", chunk.getClaimType() != null ? chunk.getClaimType() : "事实陈述");
        epistemologyTag.set("source", chunk.getSource() != null ? chunk.getSource() : "document");
        epistemologyTag.set("confidence", chunk.getConfidence());
        epistemologyTag.set("chunk_summary", chunk.getChunkSummary() != null ? chunk.getChunkSummary() : "");
        metadata3d.set("3_Epistemology_Tag", epistemologyTag);

        return metadata3d.toString();
    }

    /**
     * 验证分块覆盖率并计算覆盖率比例
     * @return 覆盖率（0.0 ~ 1.0）
     */
    private double validateChunks(List<ChunkInfo> chunks, String originalText) {
        if (chunks.isEmpty()) {
            log.warn("[validateChunks] 分块结果为空");
            return 0.0;
        }
        StringBuilder merged = new StringBuilder();
        for (ChunkInfo chunk : chunks) {
            merged.append(chunk.getChunkText());
        }
        String mergedClean = merged.toString().replaceAll("\\s+", "");
        String originalClean = originalText.replaceAll("\\s+", "");
        double coverage = (double) mergedClean.length() / originalClean.length();
        if (coverage < 0.8) {
            log.warn("[validateChunks] 分块覆盖率不足: {}% (merged={}, original={})",
                    String.format("%.1f", coverage * 100), mergedClean.length(), originalClean.length());
        } else {
            log.info("[validateChunks] 分块覆盖率: {}%", String.format("%.1f", coverage * 100));
        }
        return coverage;
    }

    private String extractJsonFromResponse(String response) {
        if (response == null) {
            throw new RuntimeException("LLM 响应为空");
        }
        String trimmed = response.trim();
        String candidate = extractJsonCandidate(trimmed);
        return sanitizeJson(candidate);
    }

    private String extractJsonCandidate(String text) {
        int jsonStart = text.indexOf("```json");
        if (jsonStart != -1) {
            int contentStart = text.indexOf("\n", jsonStart) + 1;
            int contentEnd = text.indexOf("```", contentStart);
            if (contentStart > 0 && contentEnd != -1) {
                return text.substring(contentStart, contentEnd).trim();
            }
        }
        int codeStart = text.indexOf("```");
        if (codeStart != -1) {
            int contentStart = text.indexOf("\n", codeStart) + 1;
            int contentEnd = text.indexOf("```", contentStart);
            if (contentStart > 0 && contentEnd != -1) {
                String content = text.substring(contentStart, contentEnd).trim();
                if (content.startsWith("{")) {
                    return content;
                }
            }
        }
        int firstBrace = text.indexOf("{");
        if (firstBrace < 0) {
            throw new RuntimeException("无法从 LLM 响应中提取 JSON: " + StringUtils.abbreviate(text, 500));
        }
        int end = findBalancedJsonEnd(text, firstBrace);
        if (end < 0) {
            throw new RuntimeException("LLM 响应中的 JSON 对象不完整: " + StringUtils.abbreviate(text.substring(firstBrace), 500));
        }
        return text.substring(firstBrace, end + 1);
    }

    private int findBalancedJsonEnd(String text, int start) {
        boolean inString = false;
        boolean escaped = false;
        int depth = 0;
        for (int i = start; i < text.length(); i++) {
            char c = text.charAt(i);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (c == '\\') {
                escaped = inString;
                continue;
            }
            if (c == '"') {
                inString = !inString;
                continue;
            }
            if (inString) {
                continue;
            }
            if (c == '{') {
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) {
                    return i;
                }
            }
        }
        return -1;
    }

    private String sanitizeJson(String json) {
        String withoutComments = stripJsonComments(json);
        return withoutComments.replaceAll(",\\s*([}\\]])", "$1").trim();
    }

    private String stripJsonComments(String json) {
        StringBuilder sb = new StringBuilder();
        boolean inString = false;
        boolean escaped = false;
        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);
            if (escaped) {
                sb.append(c);
                escaped = false;
                continue;
            }
            if (c == '\\') {
                sb.append(c);
                escaped = inString;
                continue;
            }
            if (c == '"') {
                sb.append(c);
                inString = !inString;
                continue;
            }
            if (!inString && c == '/' && i + 1 < json.length()) {
                char next = json.charAt(i + 1);
                if (next == '/') {
                    i += 2;
                    while (i < json.length() && json.charAt(i) != '\n' && json.charAt(i) != '\r') {
                        i++;
                    }
                    if (i < json.length()) {
                        sb.append(json.charAt(i));
                    }
                    continue;
                }
                if (next == '*') {
                    i += 2;
                    while (i + 1 < json.length() && !(json.charAt(i) == '*' && json.charAt(i + 1) == '/')) {
                        i++;
                    }
                    i++;
                    continue;
                }
            }
            sb.append(c);
        }
        return sb.toString();
    }

    /**
     * 创建父子块（用于短文本降级场景）
     * 即使只有一个子块，也必须包裹父块以维持 RAPTOR 一致性
     */
    private List<ChunkInfo> createSingleChunk(String text, JSONObject globalMetadata) {
        String parentLocalId = "parent_0";

        ChunkInfo child = new ChunkInfo();
        child.setChunkIndex(0);
        child.setChunkText(text);
        child.setRawText(text);
        child.setSemanticBoundary("完整文档");
        child.setDomain(resolveDomain(globalMetadata));
        child.setTheme(resolveTheme(globalMetadata));
        child.setChunkLevel("child");
        child.setParentLocalId(parentLocalId);
        child.setEntities(resolveChunkItems(null, resolveGlobalEntities(globalMetadata), text).toString());
        child.setConcepts(resolveChunkItems(null, resolveGlobalConcepts(globalMetadata), text).toString());
        child.setEvents(resolveChunkEvents(null, resolveGlobalEvents(globalMetadata), text, child.getEntities(), child.getConcepts()).toString());
        child.setClaimType("事实陈述");
        child.setConfidence(0.8);
        child.setSource("document");
        child.setChunkSummary(buildFallbackSummary(text));
        child.setMetadata(buildChunkMetadata(child));

        // 父块：摘要 + 子块指针
        String parentSummary = buildFallbackSummary(text) + "（详见子块1）";
        ChunkInfo parent = new ChunkInfo();
        parent.setChunkIndex(0);
        parent.setChunkText(parentSummary);
        parent.setRawText(text);
        parent.setChunkLevel("parent");
        parent.setParentLocalId(parentLocalId);
        parent.setDomain(child.getDomain());
        parent.setTheme(child.getTheme());
        parent.setEntities("[]");
        parent.setConcepts("[]");
        parent.setEvents(child.getEvents());
        parent.setClaimType("段落聚合");
        parent.setConfidence(1.0);
        parent.setSource("parent");
        parent.setChunkSummary(parentSummary);
        parent.setMetadata(buildChunkMetadata(parent));

        List<ChunkInfo> chunks = new ArrayList<>();
        chunks.add(parent);
        chunks.add(child);
        return chunks;
    }

    /**
     * 规则分块（回退方案）
     * 按照段落和句子边界进行分块，并包裹父块以维持 RAPTOR 一致性
     */
    private List<ChunkInfo> fallbackRuleBasedChunk(String text, JSONObject globalMetadata) {
        List<ChunkInfo> childChunks = new ArrayList<>();
        String parentLocalId = "parent_0";

        // 按段落分割
        String[] paragraphs = text.split("\n\n+");
        StringBuilder currentChunk = new StringBuilder();
        int childIndex = 0;

        for (String paragraph : paragraphs) {
            if (StringUtils.isBlank(paragraph)) {
                continue;
            }

            paragraph = paragraph.trim();

            // 如果当前块加上新段落超过阈值，保存当前块
            if (currentChunk.length() + paragraph.length() > 600 && currentChunk.length() > 0) {
                ChunkInfo chunk = createChunkInfo(currentChunk.toString(), childIndex++, globalMetadata, "段落边界");
                chunk.setParentLocalId(parentLocalId);
                chunk.setMetadata(buildChunkMetadata(chunk));
                childChunks.add(chunk);
                currentChunk = new StringBuilder();
            }

            // 如果单个段落就超过阈值，按句子分割
            if (paragraph.length() > 600) {
                if (currentChunk.length() > 0) {
                    ChunkInfo chunk = createChunkInfo(currentChunk.toString(), childIndex++, globalMetadata, "段落边界");
                    chunk.setParentLocalId(parentLocalId);
                    chunk.setMetadata(buildChunkMetadata(chunk));
                    childChunks.add(chunk);
                    currentChunk = new StringBuilder();
                }

                List<String> sentences = splitIntoSentences(paragraph);
                for (String sentence : sentences) {
                    if (currentChunk.length() + sentence.length() > 600 && currentChunk.length() > 0) {
                        ChunkInfo chunk = createChunkInfo(currentChunk.toString(), childIndex++, globalMetadata, "句子边界");
                        chunk.setParentLocalId(parentLocalId);
                        chunk.setMetadata(buildChunkMetadata(chunk));
                        childChunks.add(chunk);
                        currentChunk = new StringBuilder();
                    }
                    currentChunk.append(sentence);
                }
            } else {
                if (currentChunk.length() > 0) {
                    currentChunk.append("\n\n");
                }
                currentChunk.append(paragraph);
            }
        }

        // 保存最后一个块
        if (currentChunk.length() > 0) {
            ChunkInfo chunk = createChunkInfo(currentChunk.toString(), childIndex, globalMetadata, "段落边界");
            chunk.setParentLocalId(parentLocalId);
            chunk.setMetadata(buildChunkMetadata(chunk));
            childChunks.add(chunk);
        }

        if (childChunks.isEmpty()) {
            return childChunks;
        }

        // 构建父块：摘要包含子块指针（RAPTOR 降级场景仍保持父子结构一致性）
        StringBuilder summaryBuilder = new StringBuilder();
        summaryBuilder.append("本文档共包含").append(childChunks.size()).append("个语义段落。");
        for (int i = 0; i < childChunks.size(); i++) {
            String childSummary = childChunks.get(i).getChunkSummary();
            if (StringUtils.isNotBlank(childSummary)) {
                summaryBuilder.append(childSummary).append("（详见子块").append(i + 1).append("）；");
            }
        }
        String parentSummary = summaryBuilder.toString();

        StringBuilder parentRawText = new StringBuilder();
        for (ChunkInfo c : childChunks) {
            if (parentRawText.length() > 0) parentRawText.append("\n\n");
            parentRawText.append(c.getRawText());
        }

        ChunkInfo parent = new ChunkInfo();
        parent.setChunkIndex(0);
        parent.setChunkText(parentSummary);
        parent.setRawText(parentRawText.toString());
        parent.setChunkLevel("parent");
        parent.setParentLocalId(parentLocalId);
        parent.setDomain(resolveDomain(globalMetadata));
        parent.setTheme(resolveTheme(globalMetadata));
        parent.setEntities("[]");
        parent.setConcepts("[]");
        parent.setEvents(aggregateEvents(childChunks).toString());
        parent.setClaimType("段落聚合");
        parent.setConfidence(1.0);
        parent.setSource("parent");
        parent.setChunkSummary(parentSummary);
        parent.setMetadata(buildChunkMetadata(parent));

        List<ChunkInfo> chunks = new ArrayList<>();
        chunks.add(parent);
        chunks.addAll(childChunks);

        log.info("[IntelligentSemanticChunker] 规则分块完成（含父块），父块1个，子块{}个", childChunks.size());
        return chunks;
    }

    private ChunkInfo createChunkInfo(String text, int index, JSONObject globalMetadata, String boundary) {
        ChunkInfo chunk = new ChunkInfo();
        chunk.setChunkIndex(index);
        chunk.setChunkText(text);
        chunk.setRawText(text);
        chunk.setSemanticBoundary(boundary);
        chunk.setDomain(resolveDomain(globalMetadata));
        chunk.setTheme(resolveTheme(globalMetadata));
        chunk.setChunkLevel("child");
        chunk.setEntities(resolveChunkItems(null, resolveGlobalEntities(globalMetadata), text).toString());
        chunk.setConcepts(resolveChunkItems(null, resolveGlobalConcepts(globalMetadata), text).toString());
        chunk.setEvents(resolveChunkEvents(null, resolveGlobalEvents(globalMetadata), text, chunk.getEntities(), chunk.getConcepts()).toString());
        chunk.setClaimType("事实陈述");
        chunk.setConfidence(0.8);
        chunk.setSource("document");
        chunk.setChunkSummary(buildFallbackSummary(text));
        chunk.setMetadata(buildChunkMetadata(chunk));
        return chunk;
    }

    private String buildFallbackSummary(String text) {
        if (StringUtils.isBlank(text)) {
            return "";
        }
        String normalized = text.replaceAll("\\s+", "").trim();
        return normalized.length() <= 40 ? normalized : normalized.substring(0, 40);
    }

    /**
     * 按句子分割文本
     */
    private List<String> splitIntoSentences(String text) {
        List<String> sentences = new ArrayList<>();
        // 使用正则表达式按句子分割（支持中英文标点）
        Pattern sentencePattern = Pattern.compile("[。！？.!?]+");
        String[] parts = sentencePattern.split(text);
        
        int lastEnd = 0;
        for (String part : parts) {
            if (StringUtils.isNotBlank(part)) {
                int end = text.indexOf(part, lastEnd);
                if (end != -1) {
                    // 找到标点符号的位置
                    int punctEnd = end + part.length();
                    while (punctEnd < text.length() && "。！？.!?,，".indexOf(text.charAt(punctEnd)) != -1) {
                        punctEnd++;
                    }
                    sentences.add(text.substring(lastEnd, punctEnd).trim());
                    lastEnd = punctEnd;
                }
            }
        }
        
        // 处理剩余部分
        if (lastEnd < text.length()) {
            String remaining = text.substring(lastEnd).trim();
            if (StringUtils.isNotBlank(remaining)) {
                sentences.add(remaining);
            }
        }
        
        return sentences;
    }

    /**
     * 分块信息
     */
    public static class ChunkInfo {
        private int chunkIndex;
        private String chunkText;
        private String rawText;
        private String semanticBoundary;
        private String metadata;
        // 1_Domain_Scope（所有分块共享，从 LLM 输出或全局继承）
        private String domain;
        private String theme;
        // 2_Ontology_Routing（每个分块独立）
        private String eventId;
        private String entities;  // JSON string
        private String concepts;  // JSON string
        // 3_Epistemology_Tag（每个分块独立）
        private String claimType;
        private double confidence;
        private String source;
        private String chunkSummary;
        // 父子块（Parent-Child Chunking）
        private String parentLocalId;  // 子块所属父块的本地标识（同一次分块内引用，落库时映射为真实 parentId）
        private String chunkLevel = "child";  // parent / child
        private String events;

        public int getChunkIndex() { return chunkIndex; }
        public void setChunkIndex(int chunkIndex) { this.chunkIndex = chunkIndex; }
        public String getChunkText() { return chunkText; }
        public void setChunkText(String chunkText) { this.chunkText = chunkText; }
        public String getRawText() { return rawText; }
        public void setRawText(String rawText) { this.rawText = rawText; }
        public String getSemanticBoundary() { return semanticBoundary; }
        public void setSemanticBoundary(String semanticBoundary) { this.semanticBoundary = semanticBoundary; }
        public String getMetadata() { return metadata; }
        public void setMetadata(String metadata) { this.metadata = metadata; }
        public String getDomain() { return domain; }
        public void setDomain(String domain) { this.domain = domain; }
        public String getTheme() { return theme; }
        public void setTheme(String theme) { this.theme = theme; }
        public String getEventId() { return eventId; }
        public void setEventId(String eventId) { this.eventId = eventId; }
        public String getEntities() { return entities; }
        public void setEntities(String entities) { this.entities = entities; }
        public String getConcepts() { return concepts; }
        public void setConcepts(String concepts) { this.concepts = concepts; }
        public String getClaimType() { return claimType; }
        public void setClaimType(String claimType) { this.claimType = claimType; }
        public double getConfidence() { return confidence; }
        public void setConfidence(double confidence) { this.confidence = confidence; }
        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }
        public String getChunkSummary() { return chunkSummary; }
        public void setChunkSummary(String chunkSummary) { this.chunkSummary = chunkSummary; }
        public String getParentLocalId() { return parentLocalId; }
        public void setParentLocalId(String parentLocalId) { this.parentLocalId = parentLocalId; }
        public String getChunkLevel() { return chunkLevel; }
        public void setChunkLevel(String chunkLevel) { this.chunkLevel = chunkLevel; }
        public String getEvents() { return events; }
        public void setEvents(String events) { this.events = events; }
    }
}
