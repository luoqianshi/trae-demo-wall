package util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 统一的 API 响应构建器
 * 所有 Handler 都应该使用此类来构建一致的 JSON 响应
 *
 * 标准格式: { "success": true/false, "data": ..., "message": "...", "error": "..." }
 */
public class ApiResponse {
    private static final Gson gson = new GsonBuilder().setDateFormat("yyyy-MM-dd HH:mm:ss").create();

    private boolean success;
    private Object data;
    private String message;
    private String error;

    private ApiResponse() {}

    // ========== 静态工厂方法 ==========

    /** 成功响应（仅状态） */
    public static String success() {
        return "{\"success\":true}";
    }

    /** 成功响应（携带消息） */
    public static String success(String message) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", true);
        map.put("message", message);
        return gson.toJson(map);
    }

    /** 成功响应（携带数据对象） */
    public static String success(Object data) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", true);
        map.put("data", data);
        return gson.toJson(map);
    }

    /** 成功响应（携带数组数据 + 总数） */
    public static String success(String listKey, Object list, int count) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", true);
        map.put(listKey, list);
        map.put("count", count);
        return gson.toJson(map);
    }

    /** 成功响应（创建/插入操作，返回ID） */
    public static String created(int id) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", true);
        map.put("id", id);
        return gson.toJson(map);
    }

    /** 错误响应 */
    public static String error(String error) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", false);
        map.put("error", error);
        return gson.toJson(map);
    }

    /** 错误响应（携带错误码） */
    public static String error(int code, String error) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", false);
        map.put("error", error);
        map.put("code", code);
        return gson.toJson(map);
    }

    /** 自定义响应 */
    public static String of(Map<String, Object> fields) {
        return gson.toJson(fields);
    }

    // ========== 便捷方法 ==========

    /** 快速构建包含多字段的成功响应 */
    public static MapBuilder successBuilder() {
        return new MapBuilder(true);
    }

    /** 快速构建包含多字段的失败响应 */
    public static MapBuilder errorBuilder() {
        return new MapBuilder(false);
    }

    public static class MapBuilder {
        private final Map<String, Object> map = new LinkedHashMap<>();

        private MapBuilder(boolean success) {
            map.put("success", success);
        }

        public MapBuilder put(String key, Object value) {
            map.put(key, value);
            return this;
        }

        public MapBuilder count(int count) {
            map.put("count", count);
            return this;
        }

        public MapBuilder message(String msg) {
            map.put("message", msg);
            return this;
        }

        public MapBuilder error(String err) {
            map.put("error", err);
            return this;
        }

        public String build() {
            return gson.toJson(map);
        }
    }
}
