package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.User;
import service.UserService;
import java.util.List;
import java.util.Map;

public class UserHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();
                System.out.println("[UserHandler] " + method + " " + path + " " + exchange.getRequestURI().getQuery());

                if ("/api/users/login".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    System.out.println("[UserHandler] Login body: " + body);
                    Map<String, String> params = parseJson(body);
                    String username = params.get("username");
                    String password = params.get("password");
                    System.out.println("[UserHandler] username=" + username + ", password=" + password);
                    System.out.println("[UserHandler] Calling getUserByUsername...");
                    UserService userSvc = new UserService();
                    User user = userSvc.getUserByUsername(username);
                    System.out.println("[UserHandler] user=" + (user != null ? user.getUsername() : "null"));
                    if (user != null && userSvc.verifyPassword(password, user.getPassword())) {
                        System.out.println("[UserHandler] Login success, sending response");
                        sendResponse(exchange, "{\"success\":true,\"user\":" + toJson(user) + "}");
                    } else {
                        System.out.println("[UserHandler] Login failed");
                        sendError(exchange, 401, "Invalid username or password");
                    }
                } else if ("/api/users".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    User user = new User();
                    if (params.get("username") != null) user.setUsername(params.get("username"));
                    if (params.get("password") != null) user.setPassword(params.get("password"));
                    if (params.get("role") != null && !params.get("role").isEmpty()) {
                        user.setRole(params.get("role"));
                    } else {
                        user.setRole("cashier");
                    }
                    if (params.get("relateId") != null && !params.get("relateId").isEmpty()) {
                        user.setRelateId(Integer.parseInt(params.get("relateId")));
                    }
                    int result = new UserService().addUser(user);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if ("/api/users".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    if (query != null && query.contains("username=") && query.contains("password=")) {
                        String username = "";
                        String password = "";
                        String[] pairs = query.split("&");
                        for (String pair : pairs) {
                            if (pair.startsWith("username=")) {
                                username = pair.substring(9);
                                try { username = java.net.URLDecoder.decode(username, "UTF-8"); } catch (Exception e) { e.printStackTrace(); }
                            }
                            if (pair.startsWith("password=")) {
                                password = pair.substring(9);
                                try { password = java.net.URLDecoder.decode(password, "UTF-8"); } catch (Exception e) { e.printStackTrace(); }
                            }
                        }
                        UserService usvc = new UserService();
                        User queryUser = usvc.getUserByUsername(username);
                        if (queryUser != null && usvc.verifyPassword(password, queryUser.getPassword())) {
                            sendResponse(exchange, toJson(queryUser));
                        } else {
                            sendError(exchange, 401, "Invalid username or password");
                        }
                    } else {
                        List<User> users = new UserService().getAllUsers();
                        sendResponse(exchange, "{\"users\":" + toJson(users) + ",\"count\":" + users.size() + "}");
                    }
                } else if (path.matches("/api/users/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    User user = new UserService().getUserById(id);
                    if (user != null) {
                        sendResponse(exchange, toJson(user));
                    } else {
                        sendError(exchange, 404, "User not found");
                    }
                } else if (path.matches("/api/users/\\d+") && "DELETE".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    int result = new UserService().deleteUser(id);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if ("/api/users".equals(path) && "PUT".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    User user = new User();
                    if (params.get("id") != null && !params.get("id").isEmpty()) {
                        user.setId(Integer.parseInt(params.get("id")));
                    }
                    if (params.get("username") != null) user.setUsername(params.get("username"));
                    if (params.get("password") != null) user.setPassword(params.get("password"));
                    if (params.get("role") != null) user.setRole(params.get("role"));
                    if (params.get("relateId") != null && !params.get("relateId").isEmpty()) {
                        user.setRelateId(Integer.parseInt(params.get("relateId")));
                    }
                    int result = new UserService().updateUser(user);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }
}
