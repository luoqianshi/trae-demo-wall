package com.ice.template.service;

import cn.hutool.core.io.FileUtil;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.config.ComfyUIConfig;
import com.ice.template.integration.comfyui.ComfyUIClient;
import com.ice.template.integration.comfyui.ComfyUIWorkflowConverter;
import com.ice.template.model.entity.ComfyUIWorkflow;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.io.File;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * ComfyUI 集成业务编排：扫描本地工作流、导入为变量化副本、执行出图。
 */
@Service
public class ComfyUIService {

    private static final Logger log = LoggerFactory.getLogger(ComfyUIService.class);

    @Resource
    private ComfyUIConfig comfyUIConfig;

    @Resource
    private ComfyUIClient comfyUIClient;

    @Resource
    private ComfyUIWorkflowService comfyUIWorkflowService;

    /**
     * 扫描本地工作流目录，递归列出所有 .json 文件。
     */
    public List<Map<String, String>> scanLocalWorkflows() {
        List<Map<String, String>> result = new ArrayList<>();
        String dir = comfyUIConfig.getWorkflowDir();
        if (StringUtils.isBlank(dir)) {
            return result;
        }
        File root = new File(dir);
        if (!root.exists() || !root.isDirectory()) {
            log.warn("[ComfyUIService] 工作流目录不存在: {}", dir);
            return result;
        }
        List<File> files = FileUtil.loopFiles(root, f -> f.getName().toLowerCase().endsWith(".json"));
        for (File f : files) {
            Map<String, String> item = new HashMap<>();
            item.put("name", FileUtil.mainName(f));
            item.put("fileName", f.getName());
            item.put("path", f.getAbsolutePath());
            result.add(item);
        }
        return result;
    }

    /**
     * 导入一个本地工作流为变量化副本（不修改原文件）。若同 sourcePath 已存在则更新 schema。
     */
    public ComfyUIWorkflow importWorkflow(String sourcePath) {
        File f = new File(sourcePath);
        if (!f.exists()) {
            throw new IllegalArgumentException("工作流文件不存在: " + sourcePath);
        }
        String graphJson = FileUtil.readUtf8String(f);
        String schema = ComfyUIWorkflowConverter.extractParamSchema(graphJson);
        String outputType = detectOutputType(graphJson);
        String outputSlots = detectOutputSlots(graphJson);

        ComfyUIWorkflow existing = comfyUIWorkflowService.lambdaQuery()
                .eq(ComfyUIWorkflow::getSourcePath, sourcePath)
                .one();

        ComfyUIWorkflow wf = existing != null ? existing : new ComfyUIWorkflow();
        wf.setName(FileUtil.mainName(f));
        wf.setSourcePath(sourcePath);
        wf.setGraphJson(graphJson);
        wf.setParamSchema(schema);
        wf.setOutputType(outputType);
        wf.setOutputSlots(outputSlots);
        if (existing == null) {
            wf.setParamValues(buildDefaultValues(schema));
            comfyUIWorkflowService.save(wf);
        } else {
            wf.setParamValues(mergeParamValues(existing.getParamValues(), schema));
            comfyUIWorkflowService.updateById(wf);
        }
        return wf;
    }

    /**
     * 执行工作流。overrideValues 键为 "nodeId.paramName"。
     */
    public List<String> run(String workflowId, Map<String, Object> overrideValues, String projectId) {
        return runDetailed(workflowId, overrideValues, projectId).getOutputs();
    }

    /**
     * 执行工作流，返回结构化结果（含 outputsBySlot 分组）。
     */
    public com.ice.template.integration.comfyui.ComfyExecutionResult runDetailed(
            String workflowId, Map<String, Object> overrideValues, String projectId) {
        ComfyUIWorkflow wf = comfyUIWorkflowService.getById(workflowId);
        if (wf == null) {
            throw new IllegalArgumentException("工作流不存在: " + workflowId);
        }
        Map<String, Object> values = new HashMap<>();
        if (StringUtils.isNotBlank(wf.getParamValues())) {
            JSONObject saved = JSONUtil.parseObj(wf.getParamValues());
            for (String key : saved.keySet()) {
                values.put(key, saved.get(key));
            }
        }
        if (overrideValues != null) {
            values.putAll(overrideValues);
            wf.setParamValues(JSONUtil.toJsonStr(values));
            comfyUIWorkflowService.updateById(wf);
        }
        syncCachedInputs(values, projectId);
        String apiPrompt = ComfyUIWorkflowConverter.toApiFormat(wf.getGraphJson(), values);
        String projectDirKey = StringUtils.isNotBlank(projectId) ? projectId : null;
        log.info("[ComfyUIService] 执行工作流 {} ({}), 覆盖参数 {} 项", wf.getName(), workflowId, values.size());
        return comfyUIClient.executeDetailed(apiPrompt, null, projectDirKey);
    }

    private void syncCachedInputs(Map<String, Object> values, String projectId) {
        Set<String> synced = new HashSet<>();
        for (Object value : values.values()) {
            if (!(value instanceof String)) {
                continue;
            }
            String filename = (String) value;
            if (!filename.startsWith("trae-upload-") || !synced.add(filename)) {
                continue;
            }
            comfyUIClient.uploadCachedInputFile(filename, projectId);
        }
    }

    private String detectOutputType(String graphJson) {
        if (graphJson.contains("VHS_VideoCombine") || graphJson.contains("SaveVideo")
                || graphJson.contains("SaveAnimatedWEBP")) {
            return "video";
        }
        if (graphJson.contains("SaveAudio") || graphJson.contains("SaveAudioMP3")
                || graphJson.contains("VAEDecodeAudio")) {
            return "audio";
        }
        return "image";
    }

    /** 保存节点类型 → 媒体类型 映射（用于识别 output slot） */
    private static final Map<String, String> SAVE_NODE_MEDIA_KIND = new HashMap<>();
    static {
        // 图片
        SAVE_NODE_MEDIA_KIND.put("SaveImage", "image");
        SAVE_NODE_MEDIA_KIND.put("SaveImageWebsocket", "image");
        SAVE_NODE_MEDIA_KIND.put("PreviewImage", "image");
        // 视频
        SAVE_NODE_MEDIA_KIND.put("SaveVideo", "video");
        SAVE_NODE_MEDIA_KIND.put("VHS_VideoCombine", "video");
        SAVE_NODE_MEDIA_KIND.put("SaveAnimatedWEBP", "video");
        SAVE_NODE_MEDIA_KIND.put("SaveAnimatedPNG", "video");
        // 音频
        SAVE_NODE_MEDIA_KIND.put("SaveAudio", "audio");
        SAVE_NODE_MEDIA_KIND.put("SaveAudioMP3", "audio");
    }

    /**
     * 扫描 graphJson 里所有"保存类节点"，为每个节点生成一个 OutputSlot。
     * key/comfyNodeId 使用 ComfyUI 节点的稳定 id（比如 "37"），label 从 _meta.title 提取。
     *
     * 兼容策略：若 graphJson 是"UI 格式"（顶层含 nodes 数组，每个 node 有 type/id/title），
     * 也支持解析；若什么都找不到，返回 null，让上层用 outputType 生成 fallback。
     */
    private String detectOutputSlots(String graphJson) {
        if (StringUtils.isBlank(graphJson)) return null;
        List<com.ice.template.model.dto.OutputSlot> slots = new ArrayList<>();
        Set<String> seenKeys = new HashSet<>();
        JSONObject root;
        try {
            root = JSONUtil.parseObj(graphJson);
        } catch (Exception e) {
            log.warn("[detectOutputSlots] graphJson 解析失败: {}", e.getMessage());
            return null;
        }

        // ---- 情况 1：API 格式（顶层是 { "<nodeId>": {class_type, inputs, _meta} }） ----
        // 除了 nodes/links/groups 这些 UI 元字段外，其余字段都是 nodeId
        for (String k : root.keySet()) {
            if ("nodes".equals(k) || "links".equals(k) || "groups".equals(k)
                    || "extra".equals(k) || "config".equals(k) || "version".equals(k)
                    || "last_node_id".equals(k) || "last_link_id".equals(k)) {
                continue;
            }
            Object v = root.get(k);
            if (!(v instanceof JSONObject)) continue;
            JSONObject node = (JSONObject) v;
            String classType = node.getStr("class_type");
            if (classType == null) continue;
            String kind = SAVE_NODE_MEDIA_KIND.get(classType);
            if (kind == null) continue;
            String title = null;
            JSONObject meta = node.getJSONObject("_meta");
            if (meta != null) title = meta.getStr("title");
            addSlot(slots, seenKeys, k, title, kind, classType);
        }

        // ---- 情况 2：UI 格式（顶层含 nodes 数组，每个 element {id, type, title, ...}） ----
        if (slots.isEmpty()) {
            JSONArray nodes = root.getJSONArray("nodes");
            if (nodes != null) {
                for (int i = 0; i < nodes.size(); i++) {
                    JSONObject node = nodes.getJSONObject(i);
                    if (node == null) continue;
                    String type = node.getStr("type");
                    if (type == null) continue;
                    String kind = SAVE_NODE_MEDIA_KIND.get(type);
                    if (kind == null) continue;
                    String id = node.getStr("id");
                    if (id == null) id = String.valueOf(node.getInt("id", -1));
                    String title = node.getStr("title");
                    addSlot(slots, seenKeys, id, title, kind, type);
                }
            }
        }

        if (slots.isEmpty()) return null;
        return JSONUtil.toJsonStr(slots);
    }

    private void addSlot(List<com.ice.template.model.dto.OutputSlot> slots, Set<String> seenKeys,
                          String nodeId, String title, String kind, String classType) {
        if (StringUtils.isBlank(nodeId) || "-1".equals(nodeId)) return;
        if (!seenKeys.add(nodeId)) return;
        String label = StringUtils.isNotBlank(title) ? title : defaultSlotLabel(kind, slots);
        slots.add(new com.ice.template.model.dto.OutputSlot(nodeId, label, kind, nodeId));
    }

    private String defaultSlotLabel(String kind, List<com.ice.template.model.dto.OutputSlot> existing) {
        long sameKind = existing.stream().filter(s -> kind.equals(s.getMediaKind())).count();
        String base;
        switch (kind) {
            case "video": base = "视频输出"; break;
            case "audio": base = "音频输出"; break;
            default:      base = "图片输出"; break;
        }
        return sameKind == 0 ? base : base + " " + (sameKind + 1);
    }

    private String buildDefaultValues(String schema) {
        JSONArray arr = JSONUtil.parseArray(schema);
        JSONObject values = new JSONObject(true);
        for (int i = 0; i < arr.size(); i++) {
            JSONObject p = arr.getJSONObject(i);
            String key = p.getStr("nodeId") + "." + p.getStr("paramName");
            values.set(key, p.get("value"));
        }
        return values.toString();
    }

    /**
     * 合并已有参数值与新 schema：保留用户已修改的值，补充新参数的默认值。
     */
    private String mergeParamValues(String existingValues, String schema) {
        JSONObject merged;
        try {
            merged = JSONUtil.parseObj(existingValues);
        } catch (Exception e) {
            merged = new JSONObject(true);
        }
        JSONArray arr = JSONUtil.parseArray(schema);
        for (int i = 0; i < arr.size(); i++) {
            JSONObject p = arr.getJSONObject(i);
            String key = p.getStr("nodeId") + "." + p.getStr("paramName");
            if (!merged.containsKey(key)) {
                merged.set(key, p.get("value"));
            }
        }
        return merged.toString();
    }
}
