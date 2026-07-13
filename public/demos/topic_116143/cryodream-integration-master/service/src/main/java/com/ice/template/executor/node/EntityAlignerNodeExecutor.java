package com.ice.template.executor.node;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.ice.template.executor.FlowExecutionContext;
import com.ice.template.executor.FlowNodeDataUtils;
import com.ice.template.executor.FlowNodeExecuteResult;
import com.ice.template.executor.FlowNodeExecutor;
import com.ice.template.model.dto.flow.FlowNodeDTO;
import com.ice.template.rag.EntityAlignmentService;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.*;

/**
 * 实体对齐节点（通用）
 *
 * 从上游 Writer 输出的蓝本 JSON（events/cases/opinions）中，按 entity_paths 配置
 * 抽取实体名称，交给 EntityAlignmentService 做实体对齐 + 异步自动建档。
 *
 * 参数：
 * - input_json：上游 JSON 字符串（Writer 通过 output 传递，或直接读取 context 变量 items_json/events_json/cases_json/opinions_json）
 * - items_root：数组根字段名（events / cases / opinions），空则自动嗅探
 * - entity_paths：JSON 路径数组（如 relations.source_entity, relations.target_entities[], context.company, entities[].name），支持点号+末尾 [] 表示数组展开
 */
@Component
public class EntityAlignerNodeExecutor implements FlowNodeExecutor {

    private static final Logger log = LoggerFactory.getLogger(EntityAlignerNodeExecutor.class);

    @Resource
    private EntityAlignmentService entityAlignmentService;

    @Override
    public boolean supports(String nodeType) {
        return "EntityAligner".equals(nodeType);
    }

    @Override
    public FlowNodeExecuteResult execute(FlowNodeDTO node, FlowExecutionContext context) {
        String kbId = (String) context.getVariable("kb_id");
        if (StringUtils.isBlank(kbId)) {
            kbId = FlowNodeDataUtils.getTemplateString(node, "kb_id");
        }

        String inputJson = FlowNodeDataUtils.getTemplateString(node, "input_json");
        if (StringUtils.isBlank(inputJson)) {
            inputJson = firstNonBlank(
                (String) context.getVariable("events_json"),
                (String) context.getVariable("cases_json"),
                (String) context.getVariable("opinions_json"),
                (String) context.getVariable("items_json"),
                context.getCurrentText()
            );
        }

        String rootKey = FlowNodeDataUtils.getTemplateString(node, "items_root");
        String pathsRaw = FlowNodeDataUtils.getTemplateString(node, "entity_paths");
        List<String> paths = parsePaths(pathsRaw);

        int alignedCount = 0;
        Set<String> allNames = new LinkedHashSet<>();

        try {
            if (StringUtils.isBlank(inputJson)) {
                log.warn("[EntityAligner] 输入 JSON 为空，跳过对齐");
            } else {
                JSONObject root = JSONUtil.parseObj(inputJson);
                JSONArray items = resolveItemsArray(root, rootKey);
                if (items == null || items.isEmpty()) {
                    log.info("[EntityAligner] 未找到数据数组，跳过对齐");
                } else {
                    for (int i = 0; i < items.size(); i++) {
                        JSONObject item = items.getJSONObject(i);
                        if (item == null) continue;
                        for (String path : paths) {
                            allNames.addAll(extractByPath(item, path));
                        }
                    }
                }
            }

            if (!allNames.isEmpty() && StringUtils.isNotBlank(kbId)) {
                entityAlignmentService.alignEntities(kbId, new ArrayList<>(allNames));
                alignedCount = allNames.size();
                log.info("[EntityAligner] 对齐实体完成: kbId={}, count={}", kbId, alignedCount);
            }
        } catch (Exception e) {
            log.warn("[EntityAligner] 实体对齐失败: {}", e.getMessage());
        }

        FlowNodeExecuteResult result = FlowNodeExecuteResult.of("aligned:" + alignedCount);
        result.getOutput().put("aligned_count", alignedCount);
        result.getOutput().put("entity_names", new ArrayList<>(allNames));
        return result;
    }

    private String firstNonBlank(String... values) {
        for (String v : values) {
            if (StringUtils.isNotBlank(v)) return v;
        }
        return null;
    }

    /** 解析 entity_paths 配置：支持 JSON 数组字符串 或 逗号/换行分隔的字符串 */
    private List<String> parsePaths(String raw) {
        List<String> paths = new ArrayList<>();
        if (StringUtils.isBlank(raw)) {
            paths.add("relations.source_entity");
            paths.add("relations.target_entities[]");
            paths.add("entities[].name");
            paths.add("entities[]");
            paths.add("context.company");
            paths.add("context.brand");
            return paths;
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("[")) {
            try {
                JSONArray arr = JSONUtil.parseArray(trimmed);
                for (int i = 0; i < arr.size(); i++) {
                    String p = arr.getStr(i);
                    if (StringUtils.isNotBlank(p)) paths.add(p.trim());
                }
                return paths;
            } catch (Exception ignore) {
                // fallback to split
            }
        }
        for (String s : trimmed.split("[,\\n;]")) {
            String t = s.trim();
            if (StringUtils.isNotBlank(t)) paths.add(t);
        }
        return paths;
    }

    /** 从 root 中定位数据数组：优先按 rootKey，否则嗅探 events/cases/opinions/items */
    private JSONArray resolveItemsArray(JSONObject root, String rootKey) {
        if (StringUtils.isNotBlank(rootKey) && root.containsKey(rootKey)) {
            return root.getJSONArray(rootKey);
        }
        for (String key : new String[]{"events", "cases", "opinions", "items"}) {
            if (root.containsKey(key)) {
                JSONArray arr = root.getJSONArray(key);
                if (arr != null) return arr;
            }
        }
        return null;
    }

    /**
     * 按路径提取实体名。
     * 路径语法：a.b.c、a.b[].c、a.b[]
     * - 末尾字符串直接收集
     * - 中间 [] 表示遍历数组
     */
    private List<String> extractByPath(Object node, String path) {
        List<String> collected = new ArrayList<>();
        if (node == null || StringUtils.isBlank(path)) return collected;
        String[] segments = path.split("\\.");
        walk(node, segments, 0, collected);
        return collected;
    }

    private void walk(Object node, String[] segments, int idx, List<String> out) {
        if (node == null) return;
        if (idx >= segments.length) {
            collectValue(node, out);
            return;
        }
        String seg = segments[idx];
        boolean isArray = seg.endsWith("[]");
        String key = isArray ? seg.substring(0, seg.length() - 2) : seg;

        Object child;
        if (node instanceof JSONObject) {
            child = ((JSONObject) node).get(key);
        } else {
            return;
        }
        if (child == null) return;

        if (isArray) {
            if (child instanceof JSONArray) {
                JSONArray arr = (JSONArray) child;
                for (int i = 0; i < arr.size(); i++) {
                    walk(arr.get(i), segments, idx + 1, out);
                }
            } else {
                walk(child, segments, idx + 1, out);
            }
        } else {
            walk(child, segments, idx + 1, out);
        }
    }

    private void collectValue(Object v, List<String> out) {
        if (v == null) return;
        if (v instanceof String) {
            String s = ((String) v).trim();
            if (StringUtils.isNotBlank(s)) out.add(s);
        } else if (v instanceof JSONObject) {
            JSONObject obj = (JSONObject) v;
            String name = obj.getStr("name");
            if (StringUtils.isNotBlank(name)) out.add(name.trim());
        } else if (v instanceof JSONArray) {
            JSONArray arr = (JSONArray) v;
            for (int i = 0; i < arr.size(); i++) collectValue(arr.get(i), out);
        }
    }
}
