package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Registration;
import bean.Appointment;
import service.AppointmentService;
import service.RegistrationService;
import java.util.List;
import java.util.Map;

public class AppointmentHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath();
            String method = exchange.getRequestMethod();
            AppointmentService service = new AppointmentService();
            if ("GET".equals(method)) {
                String query = exchange.getRequestURI().getQuery();
                String status = null; int page=1, size=20;
                if (query != null) {
                    for (String p : query.split("&")) { String[] kv = p.split("="); if (kv.length==2) {
                        if ("status".equals(kv[0])) status = kv[1];
                        else if ("page".equals(kv[0])) page = Integer.parseInt(kv[1]);
                        else if ("size".equals(kv[0])) size = Integer.parseInt(kv[1]);
                        else if ("patientId".equals(kv[0])) { List<Appointment> list = service.getPatientAppointments(Integer.parseInt(kv[1])); sendResponse(exchange, "{\"items\":"+toJson(list)+",\"count\":"+list.size()+"}"); return; }
                        else if ("doctorId".equals(kv[0])) { String d=query.contains("date=") ? query.substring(query.indexOf("date=")+5).split("&")[0] : ""; List<Appointment> list = service.getDoctorSchedule(Integer.parseInt(kv[1]), d); sendResponse(exchange, "{\"items\":"+toJson(list)+",\"count\":"+list.size()+"}"); return; }
                    }}
                }
                List<Appointment> list = service.getAll(status, page, size);
                sendResponse(exchange, "{\"items\":"+toJson(list)+",\"total\":"+service.countByStatus(status)+"}");
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                Appointment a = new Appointment();
                a.setPatientId(getIntParam(params,"patientId")); a.setPatientName(params.get("patientName"));
                a.setDoctorId(getIntParam(params,"doctorId")); a.setDoctorName(params.get("doctorName"));
                a.setDeptId(getIntParam(params,"deptId")); a.setDeptName(params.get("deptName"));
                try{a.setAppointmentDate(java.sql.Date.valueOf(params.get("appointmentDate")));}catch (Exception e) { e.printStackTrace(); }
                a.setTimePeriod(params.get("timePeriod")); a.setAppointmentType(params.get("appointmentType"));
                a.setRegistrationLevel(params.get("registrationLevel")); a.setStatus(params.get("status"));
                try{a.setFee(new java.math.BigDecimal(params.get("fee")));}catch (Exception e) { e.printStackTrace(); }
                int id = service.addAppointment(a);
                if (id > 0) {
                    try {
                        Registration reg = new Registration();
                        reg.setPatientId(a.getPatientId()); reg.setPatientName(a.getPatientName());
                        reg.setDoctorId(a.getDoctorId()); reg.setDoctorName(a.getDoctorName());
                        reg.setDept(a.getDeptName()); reg.setRegFee(a.getFee());
                        reg.setRegStatus("waiting"); reg.setQueueNo("A" + id);
                        reg.setRegTime(new java.util.Date());
                        new RegistrationService().register(reg);
                    } catch (Exception e) { e.printStackTrace(); }
                }
                sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/appointments/\\d+") && "PUT".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                Map<String,String> params = parseJson(getRequestBody(exchange));
                String action = params.get("action");
                boolean ok = false;
                if ("cancel".equals(action)) {
                    ok = service.cancelAppointment(id, params.get("reason"));
                    if (ok) {
                        cancelLinkedRegistrations(id);
                    }
                }
                else if ("checkin".equals(action)) ok = service.checkIn(id);
                else if ("complete".equals(action)) ok = service.completeAppointment(id);
                sendResponse(exchange, "{\"success\":"+ok+"}");
            }
        }

        private void cancelLinkedRegistrations(int appointmentId) {
            try {
                Appointment a = new AppointmentService().getAll(null, 1, 9999)
                    .stream().filter(ap -> ap.getId() == appointmentId).findFirst().orElse(null);
                if (a == null) return;
                String queueNo = "A" + appointmentId;
                java.util.List<Registration> regs = new RegistrationService().getAllRegistrations();
                for (Registration r : regs) {
                    if (queueNo.equals(r.getQueueNo())) {
                        r.setRegStatus("已取消");
                        new RegistrationService().updateRegistration(r);
                    }
                }
            } catch (Exception e) { e.printStackTrace(); }
        }
}
