package util;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;

/**
 * 过滤器风格的 HttpHandler 包装器
 * 为所有 Handler 自动添加：CORS、请求日志、错误处理、计时
 */
public class FilterHttpHandler implements HttpHandler {

    private final HttpHandler delegate;

    public FilterHttpHandler(HttpHandler delegate) {
        this.delegate = delegate;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        // 预置 CORS 头
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        exchange.getResponseHeaders().set("Access-Control-Max-Age", "86400");

        // OPTIONS 预检请求直接返回
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return;
        }

        long start = System.currentTimeMillis();
        RequestLogger.logRequest(exchange);

        try {
            delegate.handle(exchange);
            long elapsed = System.currentTimeMillis() - start;
            int code = exchange.getResponseCode();
            if (code <= 0) code = 200; // 部分 handler 可能在 sendResponseHeaders 外抛异常
            RequestLogger.logResponse(exchange, code, elapsed);
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            RequestLogger.logError(exchange, e);

            // 确保未发送响应头时才发送错误
            try {
                byte[] errorBytes = ApiResponse.error(500, "服务器内部错误: " + e.getMessage())
                        .getBytes("UTF-8");
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.sendResponseHeaders(500, errorBytes.length);
                exchange.getResponseBody().write(errorBytes);
                exchange.getResponseBody().flush();
            } catch (IOException ignored) {
                // 响应头已发送，无法再修改
            }
            exchange.close();
        }
    }
}
