package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Doctor;
import bean.Department;
import dao.DepartmentDAO;
import dao.impl.DepartmentDAOImpl;
import service.DoctorService;
import java.util.List;
import java.util.Map;

public class DoctorHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();
                System.out.println("[DoctorHandler] " + method + " " + path);

                if ("/api/doctors".equals(path)) {
                    if ("GET".equals(method)) {
                        System.out.println("[DoctorHandler] Getting all doctors...");
                        List<Doctor> doctors = new DoctorService().getAllDoctors();
                        System.out.println("[DoctorHandler] Found " + doctors.size() + " doctors");
                        sendResponse(exchange, "{\"doctors\":" + toJson(doctors) + ",\"count\":" + doctors.size() + "}");
                    } else if ("POST".equals(method)) {
                        String body = getRequestBody(exchange);
                        Map<String, String> params = parseJson(body);
                        String deptName = params.get("dept");
                        if (deptName != null && !deptName.isEmpty()) {
                            DepartmentDAO deptDAO = new dao.impl.DepartmentDAOImpl();
                            Department dept = deptDAO.findByName(deptName);
                            if (dept == null) {
                                Department newDept = new Department();
                                newDept.setName(deptName);
                                newDept.setDescription("");
                                int deptId = deptDAO.insert(newDept);
                            }
                        }
                        Doctor doctor = new Doctor();
                        if (params.get("name") != null) doctor.setName(params.get("name"));
                        if (params.get("gender") != null) doctor.setGender(params.get("gender"));
                        if (params.get("age") != null && !params.get("age").isEmpty()) doctor.setAge(Integer.parseInt(params.get("age")));
                        if (params.get("title") != null) doctor.setTitle(params.get("title"));
                        if (params.get("dept") != null) doctor.setDept(params.get("dept"));
                        if (params.get("phone") != null) doctor.setPhone(params.get("phone"));
                        String workNoValue = params.get("workNo") != null ? params.get("workNo") : params.get("work_no");
                        if (workNoValue == null || workNoValue.isEmpty()) {
                            workNoValue = "D" + System.currentTimeMillis();
                        }
                        doctor.setWorkNo(workNoValue);
                        String title = doctor.getTitle();
                        String role = "doctor";
                        if (title != null && (title.contains("护士") || title.contains("护师") || title.contains("护理"))) {
                            role = "nurse";
                        }
                        doctor.setRole(role);
                        int result = new DoctorService().addDoctor(doctor);
                        sendResponse(exchange, "{\"success\":" + (result > 0) + ",\"id\":" + result + "}");
                    }
                } else if (path.matches("/api/doctors/\\d+") && "PUT".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    Doctor existingDoctor = new DoctorService().getDoctorById(id);
                    if (existingDoctor == null) {
                        sendError(exchange, 404, "Doctor not found");
                        return;
                    }
                    Doctor doctor = new Doctor();
                    doctor.setId(id);
                    doctor.setWorkNo(existingDoctor.getWorkNo());
                    String workNoUpdate = params.get("workNo") != null ? params.get("workNo") : params.get("work_no");
                    if (workNoUpdate != null && !workNoUpdate.isEmpty()) {
                        doctor.setWorkNo(workNoUpdate);
                    }
                    if (params.get("name") != null) doctor.setName(params.get("name"));
                    else doctor.setName(existingDoctor.getName());
                    if (params.get("gender") != null) doctor.setGender(params.get("gender"));
                    if (params.get("age") != null && !params.get("age").isEmpty()) doctor.setAge(Integer.parseInt(params.get("age")));
                    if (params.get("title") != null) doctor.setTitle(params.get("title"));
                    else doctor.setTitle(existingDoctor.getTitle());
                    if (params.get("dept") != null) doctor.setDept(params.get("dept"));
                    else doctor.setDept(existingDoctor.getDept());
                    if (params.get("phone") != null) doctor.setPhone(params.get("phone"));
                    String title = doctor.getTitle();
                    if (title != null) {
                        if (title.contains("护士") || title.contains("护师") || title.contains("护理")) {
                            doctor.setRole("nurse");
                        } else {
                            doctor.setRole("doctor");
                        }
                    }
                    int result = new DoctorService().updateDoctor(doctor);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/doctors/\\d+") && "DELETE".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    int result = new DoctorService().deleteDoctor(id);
                    sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                } else if (path.matches("/api/doctors/\\d+") && "GET".equals(method)) {
                    String idStr = path.substring(path.lastIndexOf('/') + 1);
                    int id = Integer.parseInt(idStr);
                    Doctor doctor = new DoctorService().getDoctorById(id);
                    if (doctor != null) {
                        sendResponse(exchange, toJson(doctor));
                    } else {
                        sendError(exchange, 404, "Doctor not found");
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
