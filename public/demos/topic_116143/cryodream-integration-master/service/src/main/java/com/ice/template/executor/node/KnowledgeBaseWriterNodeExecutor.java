package com.ice.template.executor.node;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.integration.llm.SiliconFlowEmbeddingClient;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.model.entity.KnowledgeChunk;
import com.ice.template.model.entity.ModelConfig;
import com.ice.template.rag.PGVectorClient;
import com.ice.template.service.KnowledgeBaseService;
import com.ice.template.service.ModelConfigService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class KnowledgeBaseWriterNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseWriterNodeExecutor.class);

    @Resource
    private PGVectorClient vectorClient;

    @Resource
    private SiliconFlowEmbeddingClient embeddingClient;

    @Resource
    private KnowledgeBaseService knowledgeBaseService;

    @Resource
    private ModelConfigService modelConfigService;

    @Override
    public boolean supports(String nodeType) {
        return "KnowledgeBaseWriter".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String kbId = FlowNodeDataUtils.getTemplateString(node, "kb_id");
        String docId = FlowNodeDataUtils.getTemplateString(node, "doc_id");
        String chunksJson = org.apache.commons.lang3.StringUtils.defaultIfBlank(
                (String) context.getVariable("chunks"),
                FlowNodeDataUtils.getTemplateString(node, "chunks")
        );
        String embeddingModelId = FlowNodeDataUtils.getTemplateString(node, "embedding_model_id");
        
        log.info("[KnowledgeBaseWriter] kbId={}, docId={}, embeddingModelId={}, chunksExists={}", 
                kbId, docId, embeddingModelId, chunksJson != null);

        if (StringUtils.isBlank(kbId)) {
            throw new IllegalArgumentException("知识库ID不能为空");
        }
        if (StringUtils.isBlank(chunksJson)) {
            throw new IllegalArgumentException("Chunk数据不能为空");
        }

        ModelConfig embeddingConfig = null;
        if (StringUtils.isNotBlank(embeddingModelId)) {
            embeddingConfig = modelConfigService.getById(embeddingModelId);
            if (embeddingConfig == null) {
                log.warn("[KnowledgeBaseWriter] 指定的嵌入模型配置不存在: {}", embeddingModelId);
            }
        }
        // 如果未指定嵌入模型或指定的不存在，自动查找第一个 embedding 类型的已启用模型
        if (embeddingConfig == null) {
            embeddingConfig = modelConfigService.list().stream()
                    .filter(mc -> Integer.valueOf(1).equals(mc.getEnabled())
                            && "embedding".equalsIgnoreCase(mc.getModelType()))
                    .findFirst()
                    .orElse(null);
            if (embeddingConfig != null) {
                log.info("[KnowledgeBaseWriter] 自动选择嵌入模型: {} ({})", embeddingConfig.getName(), embeddingConfig.getModelName());
            } else {
                log.warn("[KnowledgeBaseWriter] 未找到可用的嵌入模型配置，将跳过向量生成");
            }
        }

        JSONArray chunksArray = JSONUtil.parseArray(chunksJson);
        List<KnowledgeChunk> chunks = new ArrayList<>();
        Map<String, String> parentIdMap = new java.util.HashMap<>();

        for (int i = 0; i < chunksArray.size(); i++) {
            JSONObject chunkObj = chunksArray.getJSONObject(i);
            KnowledgeChunk chunk = new KnowledgeChunk();
            chunk.setId(UUID.randomUUID().toString());
            chunk.setDocId(StringUtils.isNotBlank(docId) ? docId : UUID.randomUUID().toString());
            chunk.setKbId(kbId);
            chunk.setChunkIndex(chunkObj.getInt("index", i));
            chunk.setChunkText(chunkObj.getStr("text"));
            chunk.setRawText(chunkObj.getStr("rawText"));
            chunk.setContent(chunkObj.getStr("text"));
            Object metadataObj = chunkObj.get("metadata");
            chunk.setMetadata(metadataObj == null ? "{}" : metadataObj.toString());
            Object eventsObj = chunkObj.get("events");
            chunk.setEvents(eventsObj == null ? "[]" : eventsObj.toString());
            chunk.setChunkLevel(chunkObj.getStr("chunkLevel", "child"));
            if ("parent".equals(chunk.getChunkLevel())) {
                parentIdMap.put(chunkObj.getStr("parentLocalId"), chunk.getId());
            }

            chunks.add(chunk);
        }

        for (int i = 0; i < chunks.size(); i++) {
            KnowledgeChunk chunk = chunks.get(i);
            JSONObject chunkObj = chunksArray.getJSONObject(i);
            if ("child".equals(chunk.getChunkLevel())) {
                chunk.setParentId(parentIdMap.get(chunkObj.getStr("parentLocalId")));
            }
        }

        // 防御性校验：如果所有 chunk 都是 child 且无 parentId，自动包裹一个合成父块
        boolean hasParent = chunks.stream().anyMatch(c -> "parent".equals(c.getChunkLevel()));
        if (!hasParent && !chunks.isEmpty()) {
            log.warn("[KnowledgeBaseWriter] 未发现父块，自动合成父块包裹 {} 个子块", chunks.size());
            StringBuilder summaryBuilder = new StringBuilder();
            summaryBuilder.append("本段共包含").append(chunks.size()).append("个语义段落。");
            for (int i = 0; i < chunks.size(); i++) {
                String childSummary = "";
                try {
                    JSONObject meta = JSONUtil.parseObj(chunks.get(i).getMetadata());
                    JSONObject epist = meta.getJSONObject("3_Epistemology_Tag");
                    if (epist != null) childSummary = epist.getStr("chunk_summary", "");
                } catch (Exception ignored) {}
                if (StringUtils.isNotBlank(childSummary)) {
                    summaryBuilder.append(childSummary).append("（详见子块").append(i + 1).append("）；");
                }
            }
            String parentSummary = summaryBuilder.toString();
            StringBuilder parentRawText = new StringBuilder();
            for (KnowledgeChunk c : chunks) {
                if (parentRawText.length() > 0) parentRawText.append("\n\n");
                parentRawText.append(StringUtils.defaultString(c.getRawText()));
            }

            KnowledgeChunk syntheticParent = new KnowledgeChunk();
            syntheticParent.setId(UUID.randomUUID().toString());
            syntheticParent.setDocId(chunks.get(0).getDocId());
            syntheticParent.setKbId(kbId);
            syntheticParent.setChunkIndex(0);
            syntheticParent.setChunkText(parentSummary);
            syntheticParent.setRawText(parentRawText.toString());
            syntheticParent.setContent(parentSummary);
            syntheticParent.setChunkLevel("parent");
                syntheticParent.setEvents("[]");
                JSONObject parentMeta = new JSONObject();
            JSONObject domainScope = new JSONObject();
            domainScope.set("domain", "综合");
            domainScope.set("theme", "自动聚合");
            parentMeta.set("1_Domain_Scope", domainScope);
            JSONObject ontology = new JSONObject();
            ontology.set("entities", new JSONArray());
            ontology.set("concepts", new JSONArray());
            ontology.set("events", new JSONArray());
            ontology.set("chunk_level", "parent");
            parentMeta.set("2_Ontology_Routing", ontology);
            JSONObject epistTag = new JSONObject();
            epistTag.set("source", "parent");
            epistTag.set("claim_type", "段落聚合");
            epistTag.set("confidence", 1.0);
            epistTag.set("chunk_summary", parentSummary);
            parentMeta.set("3_Epistemology_Tag", epistTag);
            syntheticParent.setMetadata(parentMeta.toString());

            // 所有子块指向合成父块
            List<String> childIds = new ArrayList<>();
            for (KnowledgeChunk c : chunks) {
                c.setParentId(syntheticParent.getId());
                childIds.add(c.getId());
            }
            syntheticParent.setChildIds(JSONUtil.toJsonStr(childIds));
            ontology.set("child_ids", childIds);

            chunks.add(0, syntheticParent);
        }

        // RAPTOR：为父块注入 child_ids 指针
        Map<String, List<String>> parentChildIdsMap = new java.util.HashMap<>();
        for (KnowledgeChunk chunk : chunks) {
            if ("child".equals(chunk.getChunkLevel()) && StringUtils.isNotBlank(chunk.getParentId())) {
                parentChildIdsMap.computeIfAbsent(chunk.getParentId(), k -> new ArrayList<>()).add(chunk.getId());
            }
        }
        for (KnowledgeChunk chunk : chunks) {
            if ("parent".equals(chunk.getChunkLevel())) {
                List<String> childIds = parentChildIdsMap.getOrDefault(chunk.getId(), List.of());
                chunk.setChildIds(JSONUtil.toJsonStr(childIds));
                try {
                    JSONObject meta = JSONUtil.parseObj(chunk.getMetadata());
                    JSONObject ontology = meta.getJSONObject("2_Ontology_Routing");
                    if (ontology == null) {
                        ontology = new JSONObject();
                        meta.set("2_Ontology_Routing", ontology);
                    }
                    ontology.set("child_ids", childIds);
                    chunk.setMetadata(meta.toString());
                } catch (Exception e) {
                    log.warn("[KnowledgeBaseWriter] 父块 metadata 注入 child_ids 失败: {}", e.getMessage());
                }
            }
        }

        // RAPTOR 双路向量化：父块摘要 + 子块原文均参与向量化
        for (KnowledgeChunk chunk : chunks) {
            if (embeddingConfig != null) {
                try {
                    String textToEmbed = "parent".equals(chunk.getChunkLevel())
                            ? chunk.getChunkText()   // 父块 chunkText = 结构化摘要
                            : chunk.getChunkText();  // 子块 chunkText = 原文切片
                    float[] embedding = embeddingClient.embed(embeddingConfig, textToEmbed);
                    chunk.setEmbedding(vectorClient.vectorToString(embedding));
                } catch (Exception e) {
                    log.warn("[KnowledgeBaseWriter] 生成Embedding失败: chunkLevel={}, error={}", chunk.getChunkLevel(), e.getMessage());
                }
            }
        }

        vectorClient.saveChunks(chunks);

        long parentCount = chunks.stream().filter(c -> "parent".equals(c.getChunkLevel())).count();
        int childCount = (int) chunks.stream().filter(c -> "child".equals(c.getChunkLevel())).count();

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of("success");
        result.getOutput().put("kbId", kbId);
        result.getOutput().put("chunkCount", chunks.size());
        result.getOutput().put("parentChunkCount", parentCount);
        result.getOutput().put("childChunkCount", childCount);
        result.getOutput().put("storedChunkCount", chunks.size());

        log.info("[KnowledgeBaseWriter] 写入完成，父块{}个，子块{}个", parentCount, childCount);
        return result;
    }
}
