package handler;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import util.HttpUtil;
import util.JsonUtil;
import util.ApiResponse;
import util.RequestLogger;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public abstract class BaseHandler implements HttpHandler {

    protected final Gson gson = new Gson();

    // ========== 核心 HTTP 响应方法 (兼容旧代码) ==========

    protected void sendResponse(HttpExchange exchange, String response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        HttpUtil.sendResponse(exchange, response);
    }

    protected void sendError(HttpExchange exchange, int code, String error) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        HttpUtil.sendError(exchange, code, error);
    }

    // ========== 标准化响应方法 (推荐使用) ==========

    /** 成功-仅状态 */
    protected void sendSuccess(HttpExchange exchange) throws IOException {
        sendResponse(exchange, ApiResponse.success());
    }

    /** 成功-创建资源，返回ID */
    protected void sendCreated(HttpExchange exchange, int id) throws IOException {
        sendResponse(exchange, ApiResponse.created(id));
    }

    /** 成功-携带列表数据 */
    protected void sendList(HttpExchange exchange, String key, Object list, int count) throws IOException {
        sendResponse(exchange, ApiResponse.success(key, list, count));
    }

    /** 错误 */
    protected void sendErrorResponse(HttpExchange exchange, int httpCode, String error) throws IOException {
        sendResponse(exchange, ApiResponse.error(httpCode, error));
    }

    // ========== 请求体/参数解析 (兼容旧代码) ==========

    protected String getRequestBody(HttpExchange exchange) throws IOException {
        return HttpUtil.getRequestBody(exchange);
    }

    protected Map<String, String> parseJson(String json) {
        return JsonUtil.parseJson(json);
    }

    protected Map<String, Object> parseJsonToMap(String json) {
        return JsonUtil.parseJsonToMap(json);
    }

    protected List<Map<String, Object>> parseJsonArray(String json) {
        return JsonUtil.parseJsonArray(json);
    }

    // ========== JSON 序列化 (兼容旧代码) ==========

    protected String toJson(Object obj) {
        return JsonUtil.toJson(obj);
    }

    protected String toJson(java.util.List<?> list) {
        return JsonUtil.toJson(list);
    }

    protected String escapeJson(String s) {
        return JsonUtil.escapeJson(s);
    }

    protected <T> T fromJson(String json, Class<T> clazz) {
        return gson.fromJson(json, clazz);
    }

    protected <T> List<T> fromJsonArray(String json, Class<T> clazz) {
        Type listType = TypeToken.getParameterized(List.class, clazz).getType();
        return gson.fromJson(json, listType);
    }

    // ========== 查询参数 (兼容旧代码) ==========

    protected Map<String, String> parseQuery(String query) {
        Map<String, String> params = new HashMap<>();
        if (query != null && !query.isEmpty()) {
            for (String pair : query.split("&")) {
                String[] kv = pair.split("=", 2);
                if (kv.length == 2) {
                    try {
                        params.put(kv[0], java.net.URLDecoder.decode(kv[1], "UTF-8"));
                    } catch (Exception e) {
                        params.put(kv[0], kv[1]);
                    }
                }
            }
        }
        return params;
    }

    // ========== CORS (兼容旧代码) ==========

    protected boolean handleCors(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        exchange.getResponseHeaders().set("Access-Control-Max-Age", "86400");
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return true;
        }
        return false;
    }

    // ========== 路径解析 (兼容旧代码) ==========

    protected int parseIdFromPath(String path) {
        int lastSlash = path.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash < path.length() - 1) {
            try { return Integer.parseInt(path.substring(lastSlash + 1)); }
            catch (NumberFormatException e) { return -1; }
        }
        return -1;
    }

    protected String parseLastSegment(String path) {
        int lastSlash = path.lastIndexOf('/');
        if (lastSlash >= 0 && lastSlash < path.length() - 1) {
            return path.substring(lastSlash + 1);
        }
        return "";
    }

    // ========== 参数提取 (兼容旧代码) ==========

    protected int getIntParam(Map<String, String> params, String key) {
        String val = params.get(key);
        if (val == null || val.isEmpty()) return 0;
        try { return Integer.parseInt(val); } catch (NumberFormatException e) { return 0; }
    }

    protected int getIntParam(Map<String, String> params, String key, int defaultValue) {
        String val = params.get(key);
        if (val == null || val.isEmpty()) return defaultValue;
        try { return Integer.parseInt(val); } catch (NumberFormatException e) { return defaultValue; }
    }

    protected double getDoubleParam(Map<String, String> params, String key) {
        String val = params.get(key);
        if (val == null || val.isEmpty()) return 0.0;
        try { return Double.parseDouble(val); } catch (NumberFormatException e) { return 0.0; }
    }

    protected Integer getIntParamOrNull(Map<String, String> params, String key) {
        String v = params.get(key);
        if (v != null && !v.isEmpty()) {
            try { return Integer.parseInt(v); } catch (Exception e) { return null; }
        }
        return null;
    }

    protected java.math.BigDecimal getDecimalParam(Map<String, String> params, String key) {
        String val = params.get(key);
        if (val == null || val.isEmpty()) return java.math.BigDecimal.ZERO;
        try { return new java.math.BigDecimal(val); } catch (NumberFormatException e) { return java.math.BigDecimal.ZERO; }
    }

    // ========== 批量参数校验 ==========

    /**
     * 校验必填参数，缺失则发送 400 错误响应
     * @return true 表示参数缺失并已发送错误，false 表示校验通过
     */
    protected boolean requireParams(HttpExchange exchange, Map<String, String> params, String... keys) throws IOException {
        for (String key : keys) {
            String val = params.get(key);
            if (val == null || val.trim().isEmpty()) {
                sendErrorResponse(exchange, 400, "缺少必填参数: " + key);
                return true;
            }
        }
        return false;
    }
}
