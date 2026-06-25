package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Department;
import service.DepartmentService;
import java.util.List;
import java.util.Map;

public class DepartmentHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/departments".equals(path) && "GET".equals(method)) {
                    List<Department> departments = new DepartmentService().getAllDepartments();
                    sendResponse(exchange, "{\"departments\":" + toJson(departments) + ",\"count\":" + departments.size() + "}");
                } else if ("/api/departments".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Department department = new Department();
                    if (params.get("name") != null) department.setName(params.get("name"));
                    if (params.get("description") != null) department.setDescription(params.get("description"));
                    int result = new DepartmentService().addDepartment(department);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                } else if (path.matches("/api/departments/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Department department = new Department();
                    department.setId(id);
                    if (params.get("name") != null) department.setName(params.get("name"));
                    if (params.get("description") != null) department.setDescription(params.get("description"));
                    int result = new DepartmentService().updateDepartment(department);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/departments/\\d+") && "DELETE".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    int result = new DepartmentService().deleteDepartment(id);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/departments/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    Department department = new DepartmentService().getDepartmentById(id);
                    if (department != null) {
                        sendResponse(exchange, toJson(department));
                    } else {
                        sendError(exchange, 404, "Department not found");
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }
}
