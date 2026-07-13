package com.ice.template.executor.node;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 元数据附加节点
 * 
 * 如果 chunk 已经有三维背包格式的 metadata（由 IntelligentSemanticChunker 生成），
 * 则用节点配置的局部元数据覆盖 3_Epistemology_Tag 中的对应字段。
 * 
 * 如果 chunk 的 metadata 还是旧格式（扁平 JSON），则构建完整的三维背包。
 */
@Component
public class MetadataAttacherNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(MetadataAttacherNodeExecutor.class);

    @Override
    public boolean supports(String nodeType) {
        return "MetadataAttacher".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String chunksJson = StringUtils.defaultIfBlank(
                (String) context.getVariable("chunks"),
                FlowNodeDataUtils.getTemplateString(node, "chunks")
        );
        String metadataStr = (String) context.getVariable("globalMetadata");
        String claimType = FlowNodeDataUtils.getTemplateString(node, "claim_type");
        String source = FlowNodeDataUtils.getTemplateString(node, "source");
        double confidence = FlowNodeDataUtils.getTemplateDouble(node, "confidence", -1.0);

        log.info("[MetadataAttacher] chunksExists={}, metadataExists={}, claimType={}",
                StringUtils.isNotBlank(chunksJson), StringUtils.isNotBlank(metadataStr), claimType);

        if (StringUtils.isBlank(chunksJson)) {
            throw new IllegalArgumentException("Chunk数据不能为空");
        }

        JSONObject globalMetadata = null;
        if (StringUtils.isNotBlank(metadataStr)) {
            try {
                globalMetadata = JSONUtil.parseObj(metadataStr);
            } catch (Exception e) {
                log.warn("[MetadataAttacher] 解析元数据失败: {}", e.getMessage());
            }
        }

        JSONArray chunksArray = JSONUtil.parseArray(chunksJson);
        JSONArray enrichedChunks = new JSONArray();

        for (int i = 0; i < chunksArray.size(); i++) {
            JSONObject chunkObj = chunksArray.getJSONObject(i);
            JSONObject enrichedChunk = new JSONObject();
            enrichedChunk.set("index", chunkObj.getInt("index", i));
            enrichedChunk.set("text", chunkObj.getStr("text"));
            enrichedChunk.set("rawText", chunkObj.getStr("rawText"));

            // 读取已有的 metadata
            String existingMetaStr = chunkObj.getStr("metadata", "{}");
            JSONObject chunkMetadata;
            try {
                chunkMetadata = JSONUtil.parseObj(existingMetaStr);
            } catch (Exception e) {
                chunkMetadata = new JSONObject();
            }

            // 判断是否已经是三维背包格式
            if (chunkMetadata.containsKey("1_Domain_Scope") && chunkMetadata.containsKey("3_Epistemology_Tag")) {
                // 已经是三维背包格式，只覆盖 3_Epistemology_Tag 中用户指定的字段
                JSONObject epistemologyTag = chunkMetadata.getJSONObject("3_Epistemology_Tag");
                if (epistemologyTag != null) {
                    if (StringUtils.isNotBlank(claimType)) {
                        epistemologyTag.set("claim_type", claimType);
                    }
                    if (StringUtils.isNotBlank(source)) {
                        epistemologyTag.set("source", source);
                    }
                    if (confidence >= 0) {
                        epistemologyTag.set("confidence", confidence);
                    }
                }
                // 如果全局元数据有更新，也同步到 1_Domain_Scope 和 2_Ontology_Routing
                if (globalMetadata != null) {
                    mergeGlobalTo3D(chunkMetadata, globalMetadata);
                }
            } else {
                // 旧格式，构建三维背包
                chunkMetadata = build3DMetadata(chunkMetadata, globalMetadata, claimType, source, confidence);
            }

            enrichedChunk.set("metadata", chunkMetadata.toString());
            enrichedChunks.add(enrichedChunk);
        }

        String enrichedChunksJson = enrichedChunks.toString();
        context.setVariable("chunks", enrichedChunksJson);

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of(enrichedChunksJson);
        result.getOutput().put("enriched_chunks", enrichedChunksJson);
        result.getOutput().put("chunkCount", enrichedChunks.size());

        log.info("[MetadataAttacher] 元数据附加完成，共{}个Chunk", enrichedChunks.size());
        return result;
    }

    /**
     * 将全局元数据合并到已有的三维背包中
     */
    private void mergeGlobalTo3D(JSONObject metadata3d, JSONObject globalMetadata) {
        // 合并 1_Domain_Scope
        if (globalMetadata.containsKey("1_Domain_Scope")) {
            JSONObject globalDomainScope = globalMetadata.getJSONObject("1_Domain_Scope");
            if (globalDomainScope != null) {
                JSONObject domainScope = metadata3d.getJSONObject("1_Domain_Scope");
                if (domainScope == null) {
                    domainScope = new JSONObject();
                    metadata3d.set("1_Domain_Scope", domainScope);
                }
                if (globalDomainScope.containsKey("domain")) {
                    domainScope.set("domain", globalDomainScope.getStr("domain"));
                }
                if (globalDomainScope.containsKey("theme")) {
                    domainScope.set("theme", globalDomainScope.getStr("theme"));
                }
            }
        }

        // 合并 2_Ontology_Routing
        if (globalMetadata.containsKey("2_Ontology_Routing")) {
            JSONObject globalOntology = globalMetadata.getJSONObject("2_Ontology_Routing");
            if (globalOntology != null) {
                JSONObject ontology = metadata3d.getJSONObject("2_Ontology_Routing");
                if (ontology == null) {
                    ontology = new JSONObject();
                    metadata3d.set("2_Ontology_Routing", ontology);
                }
                if (globalOntology.containsKey("entities")) {
                    ontology.set("entities", globalOntology.get("entities"));
                }
                if (globalOntology.containsKey("concepts")) {
                    ontology.set("concepts", globalOntology.get("concepts"));
                }
            }
        }
    }

    private JSONObject build3DMetadata(JSONObject existingMeta, JSONObject globalMetadata, String claimType, String source, double confidence) {
        JSONObject metadata3d = new JSONObject();

        // 1_Domain_Scope
        JSONObject domainScope = new JSONObject();
        if (globalMetadata != null) {
            JSONObject globalDomainScope = globalMetadata.getJSONObject("1_Domain_Scope");
            if (globalDomainScope != null) {
                domainScope.set("domain", globalDomainScope.getStr("domain", "未分类"));
                domainScope.set("theme", globalDomainScope.getStr("theme", "未知主题"));
            } else {
                domainScope.set("domain", globalMetadata.getStr("domain", existingMeta.getStr("domain", "未分类")));
                domainScope.set("theme", globalMetadata.getStr("theme", existingMeta.getStr("theme", "未知主题")));
            }
        } else {
            domainScope.set("domain", existingMeta.getStr("domain", "未分类"));
            domainScope.set("theme", existingMeta.getStr("theme", "未知主题"));
        }
        metadata3d.set("1_Domain_Scope", domainScope);

        // 2_Ontology_Routing
        JSONObject ontologyRouting = new JSONObject();
        if (globalMetadata != null) {
            JSONObject globalOntology = globalMetadata.getJSONObject("2_Ontology_Routing");
            if (globalOntology != null) {
                Object entities = globalOntology.get("entities");
                Object concepts = globalOntology.get("concepts");
                Object events = globalOntology.get("events");
                ontologyRouting.set("entities", entities instanceof JSONArray ? entities : new JSONArray());
                ontologyRouting.set("concepts", concepts instanceof JSONArray ? concepts : new JSONArray());
                ontologyRouting.set("events", events instanceof JSONArray ? events : new JSONArray());
            } else {
                Object entities = globalMetadata.get("entities");
                Object concepts = globalMetadata.get("concepts");
                Object events = globalMetadata.get("events");
                ontologyRouting.set("entities", entities instanceof JSONArray ? entities : new JSONArray());
                ontologyRouting.set("concepts", concepts instanceof JSONArray ? concepts : new JSONArray());
                ontologyRouting.set("events", events instanceof JSONArray ? events : new JSONArray());
            }
        } else {
            Object entities = existingMeta.get("entities");
            Object concepts = existingMeta.get("concepts");
            Object events = existingMeta.get("events");
            ontologyRouting.set("entities", entities instanceof JSONArray ? entities : new JSONArray());
            ontologyRouting.set("concepts", concepts instanceof JSONArray ? concepts : new JSONArray());
            ontologyRouting.set("events", events instanceof JSONArray ? events : new JSONArray());
        }
        metadata3d.set("2_Ontology_Routing", ontologyRouting);

        // 3_Epistemology_Tag
        JSONObject epistemologyTag = new JSONObject();
        epistemologyTag.set("time_stamp", java.time.LocalDate.now().toString());
        epistemologyTag.set("claim_type", StringUtils.isNotBlank(claimType) ? claimType : existingMeta.getStr("claimType", "事实陈述"));
        epistemologyTag.set("source", StringUtils.isNotBlank(source) ? source : "document");
        epistemologyTag.set("confidence", confidence >= 0 ? confidence : existingMeta.getDouble("confidence", 0.8));
        epistemologyTag.set("chunk_summary", existingMeta.getStr("chunk_summary", ""));
        metadata3d.set("3_Epistemology_Tag", epistemologyTag);

        return metadata3d;
    }
}
