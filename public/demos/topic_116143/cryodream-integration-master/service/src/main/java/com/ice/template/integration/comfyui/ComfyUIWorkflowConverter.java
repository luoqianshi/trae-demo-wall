package com.ice.template.integration.comfyui;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONNull;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * ComfyUI 工作流转换器：
 * 1. 从 UI 格式 graph 中提取可变参数 schema（包含 subgraph 实例节点的 widget 输入）；
 * 2. 将 UI 格式 graph + 参数值 转换为 ComfyUI /prompt 所需的 API 格式（自动展开 subgraph）。
 */
public class ComfyUIWorkflowConverter {

    private static final Logger log = LoggerFactory.getLogger(ComfyUIWorkflowConverter.class);

    /**
     * 默认暴露为可变参数的节点类型 → widget 名集合。
     * 不暴露模型加载类（UNETLoader/CLIPLoader/VAELoader）等固定配置。
     */
    private static final Map<String, List<String>> EXPOSED_WIDGETS = new HashMap<>();

    /**
     * 标记需要按图片类型暴露的 widget。键为 "nodeType.widgetName"。
     */
    private static final Set<String> IMAGE_WIDGETS = new HashSet<>();

    private static final Map<String, List<String>> LEGACY_WIDGET_ORDER = new HashMap<>();

    /**
     * subgraph 输入参数中视为图片类型的 socket type（用于在 schema 中标为 image）。
     */
    private static final Set<String> IMAGE_SOCKET_TYPES = new HashSet<>();

    /**
     * 不暴露任何 widget 的节点类型（模型加载器、输出保存、编解码等基础设施节点）。
     * 不在白名单也不在黑名单的节点类型，将自动暴露所有未连线的 widget 输入。
     */
    private static final Set<String> SKIP_NODE_TYPES = new HashSet<>();

    static {
        EXPOSED_WIDGETS.put("PrimitiveStringMultiline", List.of("value"));
        EXPOSED_WIDGETS.put("CLIPTextEncode", List.of("text"));
        EXPOSED_WIDGETS.put("TextEncodeQwenImageEditPlus", List.of("prompt"));
        EXPOSED_WIDGETS.put("EmptySD3LatentImage", List.of("width", "height", "batch_size"));
        EXPOSED_WIDGETS.put("EmptyLatentImage", List.of("width", "height", "batch_size"));
        EXPOSED_WIDGETS.put("KSampler", List.of("seed", "steps", "cfg", "sampler_name", "scheduler", "denoise"));
        EXPOSED_WIDGETS.put("LoadImage", List.of("image"));
        EXPOSED_WIDGETS.put("VHS_LoadVideo", List.of("video"));

        IMAGE_WIDGETS.add("LoadImage.image");
        IMAGE_SOCKET_TYPES.add("IMAGE");

        LEGACY_WIDGET_ORDER.put("VHS_LoadVideo", List.of("video", "force_rate", "custom_width", "custom_height",
                "frame_load_cap", "skip_first_frames", "select_every_nth"));
        LEGACY_WIDGET_ORDER.put("VHS_VideoCombine", List.of("frame_rate", "loop_count", "filename_prefix", "format",
                "pingpong", "save_output", "pix_fmt", "crf", "save_metadata", "trim_to_audio"));

        // 输出/保存类
        SKIP_NODE_TYPES.add("SaveImage");
        SKIP_NODE_TYPES.add("PreviewImage");
        // 模型加载类（更换模型可能导致工作流不可用）
        SKIP_NODE_TYPES.add("CheckpointLoaderSimple");
        SKIP_NODE_TYPES.add("CheckpointLoader");
        SKIP_NODE_TYPES.add("UNETLoader");
        SKIP_NODE_TYPES.add("CLIPLoader");
        SKIP_NODE_TYPES.add("DualCLIPLoader");
        SKIP_NODE_TYPES.add("VAELoader");
        SKIP_NODE_TYPES.add("LoraLoader");
        SKIP_NODE_TYPES.add("LoraLoaderModelOnly");
        // 编解码类（无 widget 参数）
        SKIP_NODE_TYPES.add("VAEDecode");
        SKIP_NODE_TYPES.add("VAEEncode");
        SKIP_NODE_TYPES.add("VAEDecodeTiled");
        SKIP_NODE_TYPES.add("VAEEncodeTiled");
        // 注释类
        SKIP_NODE_TYPES.add("Note");
        SKIP_NODE_TYPES.add("MarkdownNote");
    }

    /**
     * 提取可变参数 schema。返回 JSON 数组字符串，每项：
     * { nodeId, nodeType, title, paramName, label, type, value }
     * subgraph 实例节点会展开其输入端口为多个可调参数。
     */
    public static String extractParamSchema(String graphJson) {
        JSONObject graph = JSONUtil.parseObj(graphJson);
        JSONArray nodes = graph.getJSONArray("nodes");
        JSONArray links = graph.getJSONArray("links");
        JSONArray schema = new JSONArray();
        if (nodes == null) {
            return schema.toString();
        }
        Map<String, JSONObject> subgraphById = collectSubgraphDefinitions(graph);
        // 收集 nodeById 和 linkMap（用于判断 subgraph image 输入对应的外层 LoadImage 是否启用）
        Map<String, JSONObject> nodeById = new HashMap<>();
        for (int i = 0; i < nodes.size(); i++) {
            JSONObject n = nodes.getJSONObject(i);
            nodeById.put(String.valueOf(n.get("id")), n);
        }
        Map<Integer, Object[]> linkMap = new HashMap<>();
        if (links != null) {
            for (int i = 0; i < links.size(); i++) {
                JSONArray link = links.getJSONArray(i);
                Integer linkId = link.getInt(0);
                String originNode = String.valueOf(link.get(1));
                Integer originSlot = link.getInt(2);
                linkMap.put(linkId, new Object[]{originNode, originSlot});
            }
        }

        for (int i = 0; i < nodes.size(); i++) {
            JSONObject node = nodes.getJSONObject(i);
            String type = node.getStr("type");
            Integer mode = node.getInt("mode", 0);
            if (mode != null && (mode == 2 || mode == 4)) {
                log.debug("[extractParamSchema] skip bypassed node type={}", type);
                continue;
            }
            if (SKIP_NODE_TYPES.contains(type)) {
                log.debug("[extractParamSchema] skip blacklisted type={}", type);
                continue;
            }
            // 普通节点处理
            if (EXPOSED_WIDGETS.containsKey(type)) {
                appendPlainNodeSchema(node, type, schema);
                continue;
            }
            // subgraph 实例节点：type 等于某个 subgraph 定义的 id
            JSONObject subDef = subgraphById.get(type);
            if (subDef != null) {
                appendSubgraphSchema(node, subDef, schema, nodeById, linkMap);
                continue;
            }
            // 未知节点类型：自动暴露所有未连线的 widget 输入
            appendUnknownNodeSchema(node, schema);
        }
        return schema.toString();
    }

    private static void appendPlainNodeSchema(JSONObject node, String type, JSONArray schema) {
        List<String> exposed = EXPOSED_WIDGETS.get(type);
        List<String> widgetOrder = widgetInputOrder(node);
        String title = StringUtils.defaultIfBlank(node.getStr("title"), type);

        for (String widgetName : exposed) {
            int idx = widgetOrder.indexOf(widgetName);
            if (idx < 0) {
                continue;
            }
            if (isWidgetLinked(node, widgetName)) {
                continue;
            }
            Object value = getWidgetValue(node, widgetName, idx);
            JSONObject param = new JSONObject(true);
            param.set("nodeId", String.valueOf(node.get("id")));
            param.set("nodeType", type);
            param.set("title", title);
            param.set("paramName", widgetName);
            param.set("label", buildLabel(type, title, widgetName));
            String paramType = inferType(type, widgetName, value);
            param.set("type", paramType);
            param.set("value", value);
            schema.add(param);
        }
    }

    /**
     * 未知节点类型的兜底：自动暴露所有未连线的 widget 输入为可调参数。
     */
    private static void appendUnknownNodeSchema(JSONObject node, JSONArray schema) {
        List<String> widgetOrder = widgetInputOrder(node);
        String type = node.getStr("type");
        String title = StringUtils.defaultIfBlank(node.getStr("title"), type);

        for (String widgetName : widgetOrder) {
            if (isUiOnlyWidget(type, widgetName)) {
                continue;
            }
            if (isWidgetLinked(node, widgetName)) {
                continue;
            }
            int idx = widgetOrder.indexOf(widgetName);
            Object value = idx >= 0 ? getWidgetValue(node, widgetName, idx) : null;
            JSONObject param = new JSONObject(true);
            param.set("nodeId", String.valueOf(node.get("id")));
            param.set("nodeType", type);
            param.set("title", title);
            param.set("paramName", widgetName);
            param.set("label", title + " - " + widgetName);
            String paramType = inferType(type, widgetName, value);
            param.set("type", paramType);
            param.set("value", value);
            schema.add(param);
        }
    }

    /**
     * 把 subgraph 实例节点的输入端口暴露为可调参数。
     * - IMAGE 类型 → image 参数（前端需上传图片，填入 ComfyUI input 文件名）
     * - INT/FLOAT/STRING/BOOLEAN/COMBO → 对应标量
     * - 默认值优先取实例节点的 widgets_values（若有）；否则从内部节点的对应 widget 默认值回填
     */
    private static void appendSubgraphSchema(JSONObject instance, JSONObject subDef, JSONArray schema,
                                              Map<String, JSONObject> nodeById,
                                              Map<Integer, Object[]> linkMap) {
        JSONArray subInputs = subDef.getJSONArray("inputs");
        if (subInputs == null) {
            return;
        }
        JSONArray instanceInputs = instance.getJSONArray("inputs");
        JSONArray instanceWidgetValues = getWidgetsValuesArray(instance);
        String instanceId = String.valueOf(instance.get("id"));
        String instanceTitle = StringUtils.defaultIfBlank(instance.getStr("title"),
                StringUtils.defaultIfBlank(subDef.getStr("name"), "Subgraph"));

        int widgetIdx = 0;
        for (int i = 0; i < subInputs.size(); i++) {
            JSONObject sIn = subInputs.getJSONObject(i);
            String name = sIn.getStr("name");
            String socketType = StringUtils.defaultString(sIn.getStr("type"));
            boolean isImage = IMAGE_SOCKET_TYPES.contains(socketType);

            // 实例节点上该输入是否被外部连线占用
            Integer outerLink = null;
            if (instanceInputs != null) {
                for (int k = 0; k < instanceInputs.size(); k++) {
                    JSONObject ii = instanceInputs.getJSONObject(k);
                    if (name.equals(ii.getStr("name"))) {
                        outerLink = ii.getInt("link");
                        break;
                    }
                }
            }

            // 若是 image 输入：检查外部 link 指向的节点是否被禁用，禁用则不暴露该插槽
            if (isImage) {
                if (outerLink != null) {
                    Object[] origin = linkMap.get(outerLink);
                    if (origin != null) {
                        JSONObject originNode = nodeById.get(String.valueOf(origin[0]));
                        Integer originMode = originNode == null ? 0 : originNode.getInt("mode", 0);
                        if (originMode != null && (originMode == 2 || originMode == 4)) {
                            // 上游 LoadImage 被禁用，前端不展示此插槽
                            continue;
                        }
                    }
                }
                JSONObject param = new JSONObject(true);
                param.set("nodeId", instanceId);
                param.set("nodeType", "Subgraph");
                param.set("title", instanceTitle);
                param.set("paramName", name);
                param.set("label", instanceTitle + " - " + name);
                param.set("type", "image");
                param.set("value", "");
                schema.add(param);
                continue;
            }

            // 非图像 widget：默认值取实例 widgets_values[widgetIdx]，否则内部回溯
            Object value = null;
            if (instanceWidgetValues != null && widgetIdx < instanceWidgetValues.size()) {
                value = instanceWidgetValues.get(widgetIdx);
            }
            if (value == null || (value instanceof String && ((String) value).isEmpty())) {
                value = findSubgraphInputDefault(subDef, i);
            }
            // 如果该输入在实例上被外部连线占用，则不暴露
            if (outerLink != null) {
                widgetIdx++;
                continue;
            }
            JSONObject param = new JSONObject(true);
            param.set("nodeId", instanceId);
            param.set("nodeType", "Subgraph");
            param.set("title", instanceTitle);
            param.set("paramName", name);
            param.set("label", instanceTitle + " - " + name);
            param.set("type", inferType(value));
            param.set("value", value);
            schema.add(param);
            widgetIdx++;
        }
    }

    /**
     * 在 subgraph 内部链路上回溯第 inputIndex 个外部输入的默认值：
     * 找到 links 中 origin_id=-10 且 origin_slot=inputIndex 的 link，
     * 然后在 target 节点的 widgets_values 对应位置读取默认值。
     */
    private static Object findSubgraphInputDefault(JSONObject subDef, int inputIndex) {
        JSONArray innerLinks = subDef.getJSONArray("links");
        JSONArray innerNodes = subDef.getJSONArray("nodes");
        if (innerLinks == null || innerNodes == null) {
            return null;
        }
        for (int i = 0; i < innerLinks.size(); i++) {
            JSONObject lk = innerLinks.getJSONObject(i);
            Integer origin = lk.getInt("origin_id");
            Integer originSlot = lk.getInt("origin_slot");
            if (origin == null || originSlot == null) {
                continue;
            }
            if (origin == -10 && originSlot == inputIndex) {
                Integer targetId = lk.getInt("target_id");
                Integer targetSlot = lk.getInt("target_slot");
                if (targetId == null || targetSlot == null) {
                    continue;
                }
                JSONObject targetNode = findNodeById(innerNodes, targetId);
                if (targetNode == null) {
                    continue;
                }
                JSONArray inputs = targetNode.getJSONArray("inputs");
                if (inputs == null || targetSlot >= inputs.size()) {
                    continue;
                }
                String widgetName = inputs.getJSONObject(targetSlot).getStr("name");
                List<String> order = widgetInputOrder(targetNode);
                int idx = order.indexOf(widgetName);
                Object value = getWidgetValue(targetNode, widgetName, idx);
                if (value != null) {
                    return value;
                }
            }
        }
        return null;
    }

    private static JSONObject findNodeById(JSONArray nodes, Integer id) {
        if (nodes == null || id == null) return null;
        for (int i = 0; i < nodes.size(); i++) {
            JSONObject n = nodes.getJSONObject(i);
            if (id.equals(n.getInt("id"))) {
                return n;
            }
        }
        return null;
    }

    private static Map<String, JSONObject> collectSubgraphDefinitions(JSONObject graph) {
        Map<String, JSONObject> map = new HashMap<>();
        JSONObject definitions = graph.getJSONObject("definitions");
        if (definitions == null) return map;
        JSONArray subgraphs = definitions.getJSONArray("subgraphs");
        if (subgraphs == null) return map;
        for (int i = 0; i < subgraphs.size(); i++) {
            JSONObject sg = subgraphs.getJSONObject(i);
            String id = sg.getStr("id");
            if (StringUtils.isNotBlank(id)) {
                map.put(id, sg);
            }
        }
        return map;
    }

    /**
     * 判断某个 widget 名对应的输入是否已被上游连线占用（link != null）。
     */
    private static boolean isWidgetLinked(JSONObject node, String widgetName) {
        JSONArray inputs = node.getJSONArray("inputs");
        if (inputs == null) {
            return false;
        }
        for (int i = 0; i < inputs.size(); i++) {
            JSONObject inp = inputs.getJSONObject(i);
            boolean isWidget = inp.getJSONObject("widget") != null || isNotNull(inp.get("widget"));
            if (isWidget && widgetName.equals(inp.getStr("name"))) {
                return isNotNull(inp.get("link"));
            }
        }
        return false;
    }

    /**
     * 返回某个 widget 名对应输入的连线 id（被连线占用时），否则返回 null。
     */
    private static Integer widgetLinkId(JSONObject node, String widgetName) {
        JSONArray inputs = node.getJSONArray("inputs");
        if (inputs == null) {
            return null;
        }
        for (int i = 0; i < inputs.size(); i++) {
            JSONObject inp = inputs.getJSONObject(i);
            boolean isWidget = inp.getJSONObject("widget") != null || isNotNull(inp.get("widget"));
            if (isWidget && widgetName.equals(inp.getStr("name")) && isNotNull(inp.get("link"))) {
                return inp.getInt("link");
            }
        }
        return null;
    }

    /**
     * 判断值是否非 null 且非 JSONNull。
     */
    private static boolean isNotNull(Object value) {
        return value != null && !(value instanceof JSONNull);
    }

    /**
     * 计算节点 widget 在 widgets_values 中的顺序。
     */
    private static JSONArray getWidgetsValuesArray(JSONObject node) {
        Object raw = node.get("widgets_values");
        if (raw instanceof JSONArray) {
            return (JSONArray) raw;
        }
        if (raw instanceof JSONObject) {
            JSONArray arr = new JSONArray();
            List<String> order = widgetInputOrderFromInputs(node);
            JSONObject obj = (JSONObject) raw;
            for (String widgetName : order) {
                arr.add(obj.get(widgetName));
            }
            return arr;
        }
        return null;
    }

    private static boolean hasWidgetInput(JSONObject node, String widgetName) {
        JSONArray inputs = node.getJSONArray("inputs");
        if (inputs == null) {
            return false;
        }
        for (int i = 0; i < inputs.size(); i++) {
            JSONObject inp = inputs.getJSONObject(i);
            if ((inp.getJSONObject("widget") != null || inp.get("widget") != null)
                    && widgetName.equals(inp.getStr("name"))) {
                return true;
            }
        }
        return false;
    }

    private static List<String> widgetInputOrderFromInputs(JSONObject node) {
        List<String> order = new ArrayList<>();
        JSONArray inputs = node.getJSONArray("inputs");
        if (inputs != null) {
            for (int i = 0; i < inputs.size(); i++) {
                JSONObject inp = inputs.getJSONObject(i);
                if (inp.getJSONObject("widget") != null || inp.get("widget") != null) {
                    order.add(inp.getStr("name"));
                }
            }
        }
        return order;
    }

    private static Object getWidgetValue(JSONObject node, String widgetName, int idx) {
        Object raw = node.get("widgets_values");
        if (raw instanceof JSONArray) {
            JSONArray arr = (JSONArray) raw;
            List<String> order = LEGACY_WIDGET_ORDER.getOrDefault(node.getStr("type"), List.of());
            int legacyIdx = order.indexOf(widgetName);
            if (legacyIdx >= 0 && legacyIdx < arr.size() && hasWidgetInput(node, widgetName)) {
                return arr.get(legacyIdx);
            }
            return idx >= 0 && idx < arr.size() ? arr.get(idx) : null;
        }
        if (raw instanceof JSONObject) {
            return ((JSONObject) raw).get(widgetName);
        }
        if (raw instanceof String && idx == 0) {
            return raw;
        }
        return null;
    }

    private static List<String> widgetInputOrder(JSONObject node) {
        List<String> order = new ArrayList<>();
        JSONArray inputs = node.getJSONArray("inputs");
        JSONArray widgetsValues = getWidgetsValuesArray(node);
        if (inputs != null) {
            for (int i = 0; i < inputs.size(); i++) {
                JSONObject inp = inputs.getJSONObject(i);
                if (inp.getJSONObject("widget") != null || inp.get("widget") != null) {
                    String name = inp.getStr("name");
                    order.add(name);
                    if ("seed".equals(name) && widgetsValues != null) {
                        int curIdx = order.size() - 1;
                        if (curIdx + 1 < widgetsValues.size()) {
                            Object next = widgetsValues.get(curIdx + 1);
                            if (next instanceof String
                                    && ("randomize".equals(next) || "fixed".equals(next)
                                    || "increment".equals(next) || "decrement".equals(next))) {
                                order.add("__control_after_generate__");
                            }
                        }
                    }
                }
            }
        }
        return order;
    }

    private static String buildLabel(String type, String title, String widgetName) {
        if ("CLIPTextEncode".equals(type) || "PrimitiveStringMultiline".equals(type)) {
            return title;
        }
        return title + " - " + widgetName;
    }

    /**
     * 纯 UI 类 widget（如 LoadImage 的 upload 按钮），不应进入 API prompt。
     */
    private static final Set<String> UI_ONLY_WIDGETS = new HashSet<>();
    static {
        UI_ONLY_WIDGETS.add("LoadImage.upload");
        UI_ONLY_WIDGETS.add("__control_after_generate__");
    }

    private static boolean isUiOnlyWidget(String type, String widgetName) {
        return UI_ONLY_WIDGETS.contains(type + "." + widgetName)
                || "__control_after_generate__".equals(widgetName);
    }

    private static String inferType(String type, String widgetName, Object value) {
        if (IMAGE_WIDGETS.contains(type + "." + widgetName)) {
            return "image";
        }
        if ("VHS_LoadVideo".equals(type) && "video".equals(widgetName)) {
            return "video";
        }
        return inferType(value);
    }

    private static String inferType(Object value) {
        if (value instanceof Integer || value instanceof Long) {
            return "int";
        }
        if (value instanceof Double || value instanceof Float) {
            return "float";
        }
        if (value instanceof Boolean) {
            return "boolean";
        }
        return "string";
    }

    /**
     * UI 格式 graph + 参数覆盖值 → ComfyUI API 格式（{nodeId:{class_type, inputs}}）。
     * 自动展开 subgraph 实例节点为内部节点。
     */
    public static String toApiFormat(String graphJson, Map<String, Object> paramValues) {
        JSONObject graph = JSONUtil.parseObj(graphJson);
        JSONArray nodes = graph.getJSONArray("nodes");
        JSONArray links = graph.getJSONArray("links");

        // 收集所有节点（含 bypassed）以判断外部 link 是否指向被禁用节点
        Map<String, JSONObject> nodeById = new HashMap<>();
        if (nodes != null) {
            for (int i = 0; i < nodes.size(); i++) {
                JSONObject n = nodes.getJSONObject(i);
                nodeById.put(String.valueOf(n.get("id")), n);
            }
        }

        // 外层 linkMap：linkId → [originNodeId, originSlot]
        Map<Integer, Object[]> outerLinkMap = new HashMap<>();
        if (links != null) {
            for (int i = 0; i < links.size(); i++) {
                JSONArray link = links.getJSONArray(i);
                Integer linkId = link.getInt(0);
                String originNode = String.valueOf(link.get(1));
                Integer originSlot = link.getInt(2);
                outerLinkMap.put(linkId, new Object[]{originNode, originSlot});
            }
        }

        Map<String, JSONObject> subgraphById = collectSubgraphDefinitions(graph);
        // 记录 subgraph 实例 → 内部输出 (innerOriginId, innerOriginSlot)，供外层 link 解析时穿透
        Map<String, int[]> instanceOutputProvider = new HashMap<>();
        // 记录 subgraph 实例 → 内部节点前缀，用于第三遍 link 改写
        Map<String, String> instancePrefixMap = new HashMap<>();
        // 实际进入展开后图的所有节点
        Map<String, Object> api = new LinkedHashMap<>();

        if (nodes == null) {
            return JSONUtil.toJsonStr(api);
        }

        // 第一遍：处理普通节点 + 收集 subgraph 实例信息
        List<JSONObject> subgraphInstances = new ArrayList<>();
        for (int i = 0; i < nodes.size(); i++) {
            JSONObject node = nodes.getJSONObject(i);
            String type = node.getStr("type");
            Integer mode = node.getInt("mode", 0);
            if (mode != null && (mode == 2 || mode == 4)) {
                continue;
            }
            if ("Note".equals(type) || "MarkdownNote".equals(type)) {
                continue;
            }
            // ComfyUI 前端 Primitive 节点不是真实节点类型，提交 API 时跳过；
            // 其值通过 widget link 已传递给下游节点，无需单独输出
            if ("PrimitiveNode".equals(type) || "PrimitiveFloat".equals(type) || "PrimitiveInt".equals(type)
                    || "PrimitiveBool".equals(type) || "PrimitiveString".equals(type)) {
                continue;
            }
            JSONObject subDef = subgraphById.get(type);
            if (subDef != null) {
                subgraphInstances.add(node);
                continue;
            }
            emitPlainNode(node, outerLinkMap, paramValues, api);
        }

        // 第二遍：展开每个 subgraph 实例
        for (JSONObject instance : subgraphInstances) {
            String type = instance.getStr("type");
            JSONObject subDef = subgraphById.get(type);
            expandSubgraph(instance, subDef, outerLinkMap, paramValues, api,
                    instanceOutputProvider, instancePrefixMap, nodeById);
        }

        // 第三遍：修正所有 api 节点中的 link 引用：若 origin 引用了 subgraph 实例，则改写为内部输出节点
        rewireOuterReferencesIntoExpandedSubgraphs(api, instanceOutputProvider, instancePrefixMap);

        // 第四遍：内联 easy-use 的 setNode/getNode 变量传递节点，避免运行环境缺少 easy getNode 时提交失败
        inlineEasyUseVariableNodes(api);

        // 第4.5遍：内联 PrimitiveNode 值到下游引用
        inlinePrimitiveNodeValues(nodes, api, paramValues);

        // 第五遍：清理无效引用（指向被禁用/跳过节点的输入）
        cleanupDanglingReferences(api);

        return JSONUtil.toJsonStr(api);
    }

    @SuppressWarnings("unchecked")
    private static void inlineEasyUseVariableNodes(Map<String, Object> api) {
        Map<String, JSONArray> variableOrigins = new HashMap<>();
        Set<String> easyNodeIds = new HashSet<>();

        // 支持三类"变量传递"节点：
        //   ComfyUI-Easy-Use: "easy setNode" / "easy getNode"（变量名在 inputs.value）
        //   ComfyUI-KJNodes:  "SetNode" / "GetNode"（变量名在 inputs.constant 或 widget）
        for (Map.Entry<String, Object> entry : api.entrySet()) {
            Map<String, Object> node = (Map<String, Object>) entry.getValue();
            String classType = String.valueOf(node.get("class_type"));
            boolean isSet = "easy setNode".equals(classType) || "SetNode".equals(classType);
            boolean isGet = "easy getNode".equals(classType) || "GetNode".equals(classType);
            if (!isSet && !isGet) {
                continue;
            }
            easyNodeIds.add(entry.getKey());
            Map<String, Object> inputs = (Map<String, Object>) node.get("inputs");
            if (inputs == null) {
                continue;
            }
            // 变量名：优先 value（easy-use），再 constant（KJNodes），再第一个非引用字符串字段
            Object name = inputs.get("value");
            if (!(name instanceof String)) {
                name = inputs.get("constant");
            }
            if (!(name instanceof String)) {
                name = firstNonValueInputName(inputs);
            }
            if (!(name instanceof String)) {
                continue;
            }
            if (isSet) {
                for (Map.Entry<String, Object> input : inputs.entrySet()) {
                    String key = input.getKey();
                    if ("value".equals(key) || "constant".equals(key)) {
                        continue;
                    }
                    Object ref = input.getValue();
                    if (ref instanceof JSONArray) {
                        variableOrigins.put((String) name, cloneRef((JSONArray) ref));
                        break;
                    }
                }
            }
        }

        for (Map.Entry<String, Object> entry : api.entrySet()) {
            Map<String, Object> node = (Map<String, Object>) entry.getValue();
            Map<String, Object> inputs = (Map<String, Object>) node.get("inputs");
            if (inputs == null) {
                continue;
            }
            for (Map.Entry<String, Object> input : inputs.entrySet()) {
                Object value = input.getValue();
                if (!(value instanceof JSONArray)) {
                    continue;
                }
                JSONArray ref = (JSONArray) value;
                if (ref.size() < 2) {
                    continue;
                }
                String originId = String.valueOf(ref.get(0));
                Object origin = api.get(originId);
                if (!(origin instanceof Map)) {
                    continue;
                }
                Map<String, Object> originNode = (Map<String, Object>) origin;
                String originClass = String.valueOf(originNode.get("class_type"));
                if (!"easy getNode".equals(originClass) && !"GetNode".equals(originClass)) {
                    continue;
                }
                Map<String, Object> originInputs = (Map<String, Object>) originNode.get("inputs");
                if (originInputs == null) {
                    continue;
                }
                Object variableName = originInputs.get("value");
                if (!(variableName instanceof String)) {
                    variableName = originInputs.get("constant");
                }
                if (!(variableName instanceof String)) {
                    variableName = firstNonValueInputName(originInputs);
                }
                if (variableName instanceof String && variableOrigins.containsKey(variableName)) {
                    input.setValue(cloneRef(variableOrigins.get(variableName)));
                }
            }
        }

        for (String id : easyNodeIds) {
            api.remove(id);
        }
    }

    private static String firstNonValueInputName(Map<String, Object> inputs) {
        // 兼容旧行为：变量名可能作为 key 出现（非 value/constant 的第一个 key）
        for (Map.Entry<String, Object> e : inputs.entrySet()) {
            String key = e.getKey();
            if ("value".equals(key) || "constant".equals(key)) {
                continue;
            }
            Object v = e.getValue();
            // 若值是字符串（KJNodes 变量名有时存在 value 字段之外），优先返回字符串值
            if (v instanceof String) {
                return (String) v;
            }
            // 否则返回 key 本身（easy-use 场景）
            return key;
        }
        return null;
    }

    private static JSONArray cloneRef(JSONArray ref) {
        JSONArray cloned = new JSONArray();
        for (Object item : ref) {
            cloned.add(item);
        }
        return cloned;
    }

    /**
     * 将引用 PrimitiveNode 的输入替换为 PrimitiveNode 的实际值。
     * PrimitiveNode 不是 ComfyUI API 中的真实节点类型，提交时需要内联其值到下游。
     */
    @SuppressWarnings("unchecked")
    private static void inlinePrimitiveNodeValues(JSONArray nodes, Map<String, Object> api, Map<String, Object> paramValues) {
        if (nodes == null) return;

        // 收集 PrimitiveNode 的值：nodeId → widget value
        Map<String, Object> primitiveValues = new HashMap<>();
        for (int i = 0; i < nodes.size(); i++) {
            JSONObject node = nodes.getJSONObject(i);
            String type = node.getStr("type");
            if (!"PrimitiveNode".equals(type) && !"PrimitiveFloat".equals(type)
                    && !"PrimitiveInt".equals(type) && !"PrimitiveBool".equals(type)
                    && !"PrimitiveString".equals(type)) {
                continue;
            }
            String nodeId = String.valueOf(node.get("id"));
            JSONArray widgetValues = node.getJSONArray("widgets_values");
            Object value = (widgetValues != null && !widgetValues.isEmpty()) ? widgetValues.get(0) : null;

            // 检查 paramValues 覆盖
            String overrideKey = nodeId + ".value";
            if (paramValues != null && paramValues.containsKey(overrideKey)) {
                value = paramValues.get(overrideKey);
            }
            primitiveValues.put(nodeId, value);
        }

        if (primitiveValues.isEmpty()) return;

        // 遍历 API 节点，将引用 PrimitiveNode 的输入替换为实际值
        for (Map.Entry<String, Object> entry : api.entrySet()) {
            Map<String, Object> node = (Map<String, Object>) entry.getValue();
            Map<String, Object> inputs = (Map<String, Object>) node.get("inputs");
            if (inputs == null) continue;

            for (Map.Entry<String, Object> inputEntry : new ArrayList<>(inputs.entrySet())) {
                Object val = inputEntry.getValue();
                if (!(val instanceof JSONArray)) continue;
                JSONArray ref = (JSONArray) val;
                if (ref.size() < 2) continue;
                String originId = String.valueOf(ref.get(0));
                if (primitiveValues.containsKey(originId)) {
                    inputs.put(inputEntry.getKey(), primitiveValues.get(originId));
                }
            }
        }
    }

    /**
     * 移除所有引用了不存在于 api 中的节点 id 的 input（可选输入会因此被舍弃，ComfyUI 视为 None）。
     */
    @SuppressWarnings("unchecked")
    private static void cleanupDanglingReferences(Map<String, Object> api) {
        Set<String> existingIds = new HashSet<>(api.keySet());
        for (Object node : api.values()) {
            Map<String, Object> n = (Map<String, Object>) node;
            Map<String, Object> inputs = (Map<String, Object>) n.get("inputs");
            if (inputs == null) continue;
            inputs.entrySet().removeIf(e -> {
                Object v = e.getValue();
                if (!(v instanceof JSONArray)) return false;
                JSONArray ref = (JSONArray) v;
                if (ref.size() < 2) return false;
                String originId = String.valueOf(ref.get(0));
                return !existingIds.contains(originId);
            });
        }
    }

    private static void emitPlainNode(JSONObject node,
                                      Map<Integer, Object[]> linkMap,
                                      Map<String, Object> paramValues,
                                      Map<String, Object> api) {
        String type = node.getStr("type");
        String nodeId = String.valueOf(node.get("id"));
        Map<String, Object> inputs = new LinkedHashMap<>();
        JSONArray nodeInputs = node.getJSONArray("inputs");

        if (nodeInputs != null) {
            for (int j = 0; j < nodeInputs.size(); j++) {
                JSONObject inp = nodeInputs.getJSONObject(j);
                boolean isWidget = inp.getJSONObject("widget") != null || inp.get("widget") != null;
                Object linkVal = inp.get("link");
                if (isWidget && linkVal == null) {
                    continue;
                }
                if (linkVal != null) {
                    Integer linkId = inp.getInt("link");
                    Object[] origin = linkMap.get(linkId);
                    if (origin != null) {
                        JSONArray ref = new JSONArray();
                        ref.add(origin[0]);
                        ref.add(origin[1]);
                        inputs.put(inp.getStr("name"), ref);
                    }
                }
            }
        }

        List<String> widgetOrder = widgetInputOrder(node);
        for (String widgetName : widgetOrder) {
            if (isUiOnlyWidget(type, widgetName)) {
                continue;
            }
            Integer linkedId = widgetLinkId(node, widgetName);
            if (linkedId != null) {
                Object[] origin = linkMap.get(linkedId);
                if (origin != null) {
                    JSONArray ref = new JSONArray();
                    ref.add(origin[0]);
                    ref.add(origin[1]);
                    inputs.put(widgetName, ref);
                }
                continue;
            }
            int idx = widgetOrder.indexOf(widgetName);
            Object val = idx >= 0 ? getWidgetValue(node, widgetName, idx) : null;
            String overrideKey = nodeId + "." + widgetName;
            if (paramValues != null && paramValues.containsKey(overrideKey)) {
                val = paramValues.get(overrideKey);
            }
            if (val != null) {
                inputs.put(widgetName, val);
            }
        }

        if (("easy setNode".equals(type) || "easy getNode".equals(type)) && !inputs.containsKey("value")) {
            Object variableName = getWidgetValue(node, "value", 0);
            if (variableName instanceof String) {
                inputs.put("value", variableName);
            }
        }

        Map<String, Object> apiNode = new LinkedHashMap<>();
        apiNode.put("class_type", type);
        apiNode.put("inputs", inputs);
        api.put(nodeId, apiNode);
    }

    /**
     * 展开一个 subgraph 实例：把内部节点拉出来，ID 加前缀，边界 link 穿透/重写。
     */
    private static void expandSubgraph(JSONObject instance, JSONObject subDef,
                                       Map<Integer, Object[]> outerLinkMap,
                                       Map<String, Object> paramValues,
                                       Map<String, Object> api,
                                       Map<String, int[]> instanceOutputProvider,
                                       Map<String, String> instancePrefixMap,
                                       Map<String, JSONObject> nodeById) {
        String instanceId = String.valueOf(instance.get("id"));
        String prefix = "sg" + instanceId + "_";

        JSONArray innerNodes = subDef.getJSONArray("nodes");
        JSONArray innerLinks = subDef.getJSONArray("links");
        JSONArray subInputs = subDef.getJSONArray("inputs");
        JSONArray subOutputs = subDef.getJSONArray("outputs");
        JSONArray instanceInputs = instance.getJSONArray("inputs");
        if (innerNodes == null) {
            return;
        }

        // 计算 inputIndex → (外部 origin) 映射；如果外部连线占用了该 image 输入，则取外层 link 的 origin
        // 否则（widget 输入）该 inputIndex 由 paramValues 注入到内部 widget 值
        Map<Integer, Object[]> inputIndexToOuterOrigin = new HashMap<>();
        Map<Integer, Object> inputIndexToWidgetValue = new HashMap<>();
        if (subInputs != null) {
            // 计算 instance widget_values 的索引：跳过 image socket 类型
            JSONArray instWv = getWidgetsValuesArray(instance);
            int widgetIdx = 0;
            for (int i = 0; i < subInputs.size(); i++) {
                JSONObject sIn = subInputs.getJSONObject(i);
                String name = sIn.getStr("name");
                String socketType = StringUtils.defaultString(sIn.getStr("type"));
                boolean isImage = IMAGE_SOCKET_TYPES.contains(socketType);

                Integer outerLink = null;
                if (instanceInputs != null) {
                    for (int k = 0; k < instanceInputs.size(); k++) {
                        JSONObject ii = instanceInputs.getJSONObject(k);
                        if (name.equals(ii.getStr("name"))) {
                            outerLink = ii.getInt("link");
                            break;
                        }
                    }
                }
                if (outerLink != null) {
                    Object[] origin = outerLinkMap.get(outerLink);
                    if (origin != null) {
                        // 若该外部 link 指向的源节点被禁用（mode=2/4）
                        // 且用户为该 image 输入提供了文件名，则合成一个虚拟 LoadImage 节点
                        String originId = String.valueOf(origin[0]);
                        JSONObject originNode = nodeById.get(originId);
                        boolean originBypassed = originNode != null
                                && originNode.getInt("mode", 0) != null
                                && (originNode.getInt("mode", 0) == 2 || originNode.getInt("mode", 0) == 4);
                        String override = null;
                        String overrideKey = instanceId + "." + name;
                        if (paramValues != null && paramValues.get(overrideKey) instanceof String) {
                            override = (String) paramValues.get(overrideKey);
                        }
                        if (isImage && originBypassed && StringUtils.isNotBlank(override)) {
                            // 合成虚拟 LoadImage
                            String virtualId = "sg" + instanceId + "_vload_" + name;
                            Map<String, Object> vInputs = new LinkedHashMap<>();
                            vInputs.put("image", override);
                            Map<String, Object> vNode = new LinkedHashMap<>();
                            vNode.put("class_type", "LoadImage");
                            vNode.put("inputs", vInputs);
                            api.put(virtualId, vNode);
                            inputIndexToOuterOrigin.put(i, new Object[]{virtualId, 0});
                        } else if (isImage && StringUtils.isNotBlank(override)) {
                            // 即便上游未被禁用，如果用户为该端口显式上传了图片，也用虚拟 LoadImage 覆盖
                            String virtualId = "sg" + instanceId + "_vload_" + name;
                            Map<String, Object> vInputs = new LinkedHashMap<>();
                            vInputs.put("image", override);
                            Map<String, Object> vNode = new LinkedHashMap<>();
                            vNode.put("class_type", "LoadImage");
                            vNode.put("inputs", vInputs);
                            api.put(virtualId, vNode);
                            inputIndexToOuterOrigin.put(i, new Object[]{virtualId, 0});
                        } else {
                            inputIndexToOuterOrigin.put(i, origin);
                        }
                    }
                } else {
                    // widget 类输入：用 paramValues 覆盖或回退到 instance.widgets_values / 内部默认
                    Object override = null;
                    String overrideKey = instanceId + "." + name;
                    if (paramValues != null && paramValues.containsKey(overrideKey)) {
                        override = paramValues.get(overrideKey);
                    }
                    if (override == null && instWv != null && !isImage && widgetIdx < instWv.size()) {
                        override = instWv.get(widgetIdx);
                    }
                    if (override == null) {
                        override = findSubgraphInputDefault(subDef, i);
                    }
                    if (isImage) {
                        // image 类型且无连线：用户在前端上传后通过 paramValues 注入了文件名
                        if (override != null) {
                            inputIndexToWidgetValue.put(i, override);
                        }
                    } else {
                        if (override != null) {
                            inputIndexToWidgetValue.put(i, override);
                        }
                    }
                }
                if (!isImage) {
                    widgetIdx++;
                }
            }
        }

        // 内部 linkMap：linkId → 处理后的 (originRef, originSlot)，其中 originRef 已带前缀；
        // 若 origin_id=-10 则解析为外部 origin 或注入 widget 值（注入时不可作为 ref，只能作为 widget value）
        Map<Integer, Object[]> innerLinkMap = new HashMap<>();
        Map<Integer, Object> innerLinkAsWidget = new HashMap<>(); // 若 link 是 -10 且对应 widget 类，则把 link 标记成 widget value
        if (innerLinks != null) {
            for (int i = 0; i < innerLinks.size(); i++) {
                JSONObject lk = innerLinks.getJSONObject(i);
                Integer linkId = lk.getInt("id");
                Integer originId = lk.getInt("origin_id");
                Integer originSlot = lk.getInt("origin_slot");
                if (linkId == null || originId == null || originSlot == null) continue;
                if (originId == -10) {
                    Object[] outer = inputIndexToOuterOrigin.get(originSlot);
                    if (outer != null) {
                        innerLinkMap.put(linkId, outer);
                    } else if (inputIndexToWidgetValue.containsKey(originSlot)) {
                        innerLinkAsWidget.put(linkId, inputIndexToWidgetValue.get(originSlot));
                    }
                } else if (originId == -20) {
                    // 输出边界：不在内部 linkMap，外层处理
                } else {
                    innerLinkMap.put(linkId, new Object[]{prefix + originId, originSlot});
                }
            }
        }

        // 处理内部节点
        for (int i = 0; i < innerNodes.size(); i++) {
            JSONObject node = innerNodes.getJSONObject(i);
            String type = node.getStr("type");
            Integer mode = node.getInt("mode", 0);
            if (mode != null && (mode == 2 || mode == 4)) continue;
            if ("Note".equals(type) || "MarkdownNote".equals(type)) continue;

            String innerNodeId = String.valueOf(node.get("id"));
            String apiId = prefix + innerNodeId;
            Map<String, Object> inputs = new LinkedHashMap<>();

            JSONArray nodeInputs = node.getJSONArray("inputs");
            if (nodeInputs != null) {
                for (int j = 0; j < nodeInputs.size(); j++) {
                    JSONObject inp = nodeInputs.getJSONObject(j);
                    boolean isWidget = inp.getJSONObject("widget") != null || inp.get("widget") != null;
                    Object linkVal = inp.get("link");
                    if (isWidget && linkVal == null) continue;
                    if (linkVal == null) continue;
                    Integer linkId = inp.getInt("link");
                    Object[] origin = innerLinkMap.get(linkId);
                    if (origin != null) {
                        JSONArray ref = new JSONArray();
                        ref.add(origin[0]);
                        ref.add(origin[1]);
                        inputs.put(inp.getStr("name"), ref);
                    }
                }
            }

            List<String> widgetOrder = widgetInputOrder(node);
            for (String widgetName : widgetOrder) {
                if (isUiOnlyWidget(type, widgetName)) continue;
                Integer linkedId = widgetLinkId(node, widgetName);
                if (linkedId != null) {
                    Object[] origin = innerLinkMap.get(linkedId);
                    if (origin != null) {
                        JSONArray ref = new JSONArray();
                        ref.add(origin[0]);
                        ref.add(origin[1]);
                        inputs.put(widgetName, ref);
                        continue;
                    }
                    if (innerLinkAsWidget.containsKey(linkedId)) {
                        inputs.put(widgetName, innerLinkAsWidget.get(linkedId));
                        continue;
                    }
                    // link 来自 -10 但未找到 widget 值（可选输入）→ 跳过
                    continue;
                }
                int idx = widgetOrder.indexOf(widgetName);
                Object val = idx >= 0 ? getWidgetValue(node, widgetName, idx) : null;
                if (val != null) {
                    inputs.put(widgetName, val);
                }
            }

            Map<String, Object> apiNode = new LinkedHashMap<>();
            apiNode.put("class_type", type);
            apiNode.put("inputs", inputs);
            api.put(apiId, apiNode);
        }

        // 解析 subgraph 输出：subOutputs[k].linkIds 是内部 link 列表，但更靠谱的是查内部 links 中 target_id=-20, target_slot=k 的 origin
        if (subOutputs != null && innerLinks != null) {
            for (int k = 0; k < subOutputs.size(); k++) {
                for (int li = 0; li < innerLinks.size(); li++) {
                    JSONObject lk = innerLinks.getJSONObject(li);
                    Integer targetId = lk.getInt("target_id");
                    Integer targetSlot = lk.getInt("target_slot");
                    Integer originId = lk.getInt("origin_id");
                    Integer originSlot = lk.getInt("origin_slot");
                    if (targetId != null && targetId == -20 && targetSlot != null && targetSlot == k
                            && originId != null && originSlot != null && originId != -10) {
                        // 该 instance 的输出 slot k 来源于 (prefix+originId, originSlot)
                        instanceOutputProvider.put(instanceId + ":" + k, new int[]{originId, originSlot});
                        break;
                    }
                }
            }
        }
        // 暂存前缀
        instancePrefixMap.put(instanceId, prefix);
    }

    /**
     * 第三遍：扫描所有已发出的 api 节点输入，把 origin = 某个 subgraph 实例 id 的引用
     * 改写为内部输出节点引用（带 prefix）。
     */
    @SuppressWarnings("unchecked")
    private static void rewireOuterReferencesIntoExpandedSubgraphs(
            Map<String, Object> api,
            Map<String, int[]> instanceOutputProvider,
            Map<String, String> instancePrefixMap) {
        if (instanceOutputProvider.isEmpty()) {
            return;
        }
        for (Object node : api.values()) {
            Map<String, Object> n = (Map<String, Object>) node;
            Map<String, Object> inputs = (Map<String, Object>) n.get("inputs");
            if (inputs == null) continue;
            for (Map.Entry<String, Object> e : inputs.entrySet()) {
                Object v = e.getValue();
                if (!(v instanceof JSONArray)) continue;
                JSONArray ref = (JSONArray) v;
                if (ref.size() < 2) continue;
                String originId = String.valueOf(ref.get(0));
                Integer originSlot = ref.getInt(1);
                int[] inner = instanceOutputProvider.get(originId + ":" + originSlot);
                String prefix = instancePrefixMap.get(originId);
                if (inner != null && prefix != null) {
                    JSONArray newRef = new JSONArray();
                    newRef.add(prefix + inner[0]);
                    newRef.add(inner[1]);
                    e.setValue(newRef);
                }
            }
        }
    }
}
