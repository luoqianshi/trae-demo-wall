package util;

import com.sun.net.httpserver.HttpExchange;
import java.text.SimpleDateFormat;
import java.util.Date;

/**
 * 请求日志工具
 * 在每个请求处理前后记录日志，便于调试和监控
 */
public class RequestLogger {

    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS");

    /** 记录请求开始 */
    public static void logRequest(HttpExchange exchange) {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        String query = exchange.getRequestURI().getQuery();
        String remote = exchange.getRemoteAddress().getAddress().getHostAddress();

        String fullPath = query != null ? path + "?" + query : path;
        System.out.printf("[%s] [%s] %s %s%n", sdf.format(new Date()), remote, method, fullPath);
    }

    /** 记录请求完成（含耗时） */
    public static void logResponse(HttpExchange exchange, int statusCode, long elapsedMs) {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        String color = statusCode >= 400 ? "ERROR" : statusCode >= 300 ? "WARN" : "OK";

        System.out.printf("[%s] [%s] %s %s → %d (%dms)%n",
                sdf.format(new Date()), color, method, path, statusCode, elapsedMs);
    }

    /** 记录异常 */
    public static void logError(HttpExchange exchange, Exception e) {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();
        System.err.printf("[%s] [ERROR] %s %s → %s%n",
                sdf.format(new Date()), method, path, e.getMessage());
    }
}
