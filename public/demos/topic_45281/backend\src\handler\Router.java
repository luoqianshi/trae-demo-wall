package handler;

import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.util.LinkedHashMap;
import java.util.Map;

public class Router {
    private final Map<String, HttpHandler> routes = new LinkedHashMap<>();

    public Router get(String path, HttpHandler handler) {
        routes.put("GET " + path, handler);
        return this;
    }

    public Router post(String path, HttpHandler handler) {
        routes.put("POST " + path, handler);
        return this;
    }

    public Router put(String path, HttpHandler handler) {
        routes.put("PUT " + path, handler);
        return this;
    }

    public Router delete(String path, HttpHandler handler) {
        routes.put("DELETE " + path, handler);
        return this;
    }

    public Router context(String path, HttpHandler handler) {
        routes.put("* " + path, handler);
        return this;
    }

    public void register(HttpServer server) {
        Map<String, HttpHandler> deduplicated = new LinkedHashMap<>();
        for (Map.Entry<String, HttpHandler> entry : routes.entrySet()) {
            String path = entry.getValue().getClass().getSimpleName();
            deduplicated.put(entry.getKey(), entry.getValue());
        }
        for (Map.Entry<String, HttpHandler> entry : routes.entrySet()) {
            String key = entry.getKey();
            String path = key.substring(key.indexOf(' ') + 1);
            server.createContext(path, entry.getValue());
        }
    }
}