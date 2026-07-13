package com.ice.template.executor;

import com.ice.template.model.dto.flow.FlowNodeDTO;
import java.util.Collections;
import java.util.Map;

public class FlowNodeDataUtils {

    private FlowNodeDataUtils() {
    }

    public static String getNodeType(FlowNodeDTO node) {
        if (node == null) {
            return "";
        }
        Object dataType = getDataValue(node, "type");
        return dataType == null ? node.getType() : String.valueOf(dataType);
    }

    public static String getDisplayName(FlowNodeDTO node) {
        Object value = getNestedValue(node, "node", "display_name");
        if (value != null) {
            return String.valueOf(value);
        }
        String nodeType = getNodeType(node);
        return nodeType == null || nodeType.isBlank() ? node.getId() : nodeType;
    }

    public static Object getTemplateValue(FlowNodeDTO node, String key) {
        Object dataValue = getNestedValue(node, "values", key);
        if (dataValue != null) {
            return dataValue;
        }
        Object nodeValue = getNestedValue(node, "node", "values", key);
        if (nodeValue != null) {
            return nodeValue;
        }
        Object field = getNestedValue(node, "node", "template", key);
        if (field instanceof Map) {
            return ((Map<?, ?>) field).get("value");
        }
        return field;
    }

    public static String getTemplateString(FlowNodeDTO node, String key) {
        Object value = getTemplateValue(node, key);
        return value == null ? "" : String.valueOf(value);
    }

    /**
     * 从节点 data 中按 key 路径获取任意值。
     * 例如 getNestedValueObj(node, "variables") → 返回 data.variables
     */
    public static Object getNestedValueObj(FlowNodeDTO node, String key) {
        Map<String, Object> data = node.getData();
        if (data == null) return null;
        return data.get(key);
    }

    public static Double getTemplateDouble(FlowNodeDTO node, String key, Double defaultValue) {
        Object value = getTemplateValue(node, key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        if (value != null) {
            try {
                return Double.parseDouble(String.valueOf(value));
            } catch (NumberFormatException ignored) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    public static Integer getTemplateInteger(FlowNodeDTO node, String key, Integer defaultValue) {
        Object value = getTemplateValue(node, key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        if (value != null) {
            try {
                return Integer.parseInt(String.valueOf(value));
            } catch (NumberFormatException ignored) {
                return defaultValue;
            }
        }
        return defaultValue;
    }

    private static Object getDataValue(FlowNodeDTO node, String key) {
        Map<String, Object> data = node.getData();
        if (data == null) {
            return null;
        }
        return data.get(key);
    }

    private static Object getNestedValue(FlowNodeDTO node, String... keys) {
        Object current = node.getData() == null ? Collections.emptyMap() : node.getData();
        for (String key : keys) {
            if (!(current instanceof Map)) {
                return null;
            }
            current = ((Map<?, ?>) current).get(key);
        }
        return current;
    }
}
