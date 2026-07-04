package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Doctor;
import bean.Drug;
import bean.Charge;
import bean.Registration;
import service.RegistrationService;
import service.ChargeService;
import service.DoctorService;
import service.DrugService;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

public class StatisticsHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();

                if ("/api/statistics/registration".equals(path) && "GET".equals(method)) {
                    Map<String, Object> stats = new java.util.HashMap<>();
                    List<Registration> allRegs = new RegistrationService().getAllRegistrations();
                    stats.put("total", allRegs.size());
                    stats.put("waiting", allRegs.stream().filter(r -> "waiting".equals(r.getRegStatus())).count());
                    stats.put("treating", allRegs.stream().filter(r -> "treating".equals(r.getRegStatus())).count());
                    stats.put("finished", allRegs.stream().filter(r -> "finished".equals(r.getRegStatus())).count());
                    sendResponse(exchange, toJson(stats));
                } else if ("/api/statistics/charge".equals(path) && "GET".equals(method)) {
                    List<Charge> charges = new ChargeService().getAllCharges();
                    double totalAmount = 0;
                    double refundedAmount = 0;
                    for (Charge charge : charges) {
                        if (charge.getTotalFee() != null) {
                            if ("refunded".equals(charge.getStatus())) {
                                refundedAmount += charge.getTotalFee().doubleValue();
                            } else {
                                totalAmount += charge.getTotalFee().doubleValue();
                            }
                        }
                    }
                    Map<String, Object> stats = new java.util.HashMap<>();
                    stats.put("totalCharges", charges.size());
                    stats.put("totalAmount", totalAmount);
                    stats.put("refundedAmount", refundedAmount);
                    stats.put("netAmount", totalAmount - refundedAmount);
                    sendResponse(exchange, toJson(stats));
                } else if ("/api/statistics/doctor".equals(path) && "GET".equals(method)) {
                    List<Doctor> doctors = new DoctorService().getAllDoctors();
                    List<Map<String, Object>> stats = doctors.stream().map(d -> {
                        Map<String, Object> map = new java.util.HashMap<>();
                        map.put("doctorId", d.getId());
                        map.put("doctorName", d.getName());
                        map.put("dept", d.getDept());
                        map.put("title", d.getTitle());
                        long count = new RegistrationService().getAllRegistrations().stream()
                            .filter(r -> r.getDoctorId() == d.getId())
                            .count();
                        map.put("registrationCount", count);
                        return map;
                    }).collect(Collectors.toList());
                    sendResponse(exchange, "{\"stats\":" + toJson(stats) + "}");
                } else if ("/api/statistics/drug".equals(path) && "GET".equals(method)) {
                    List<Drug> drugs = new DrugService().getAllDrugs();
                    DrugService.DrugWarnings warnings = new DrugService().getDrugWarnings();
                    Map<String, Object> stats = new java.util.HashMap<>();
                    stats.put("totalDrugs", drugs.size());
                    stats.put("lowStock", warnings.lowStock.size());
                    stats.put("expiring", warnings.expiring.size());
                    stats.put("expired", warnings.expired.size());
                    sendResponse(exchange, toJson(stats));
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            } finally {
                exchange.close();
            }
        }
}
