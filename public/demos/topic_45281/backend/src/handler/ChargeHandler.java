package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Charge;
import bean.Registration;
import bean.Prescription;
import bean.Examination;
import bean.ChargeItem;
import service.ChargeService;
import service.ChargeItemService;
import service.PrescriptionService;
import service.RegistrationService;
import service.PrescriptionExaminationService;
import service.AuditLogService;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;
import java.util.Date;

public class ChargeHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            try {
                String path = exchange.getRequestURI().getPath();
                String method = exchange.getRequestMethod();
                System.out.println("[ChargeHandler] " + method + " " + path);

                if ("/api/charges".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    System.out.println("[DEBUG] charge received params:");
                    for (Map.Entry<String, String> entry : params.entrySet()) {
                        System.out.println("  " + entry.getKey() + " = " + entry.getValue());
                    }
                    Charge charge = new Charge();
                    if (params.get("patientId") != null && !params.get("patientId").isEmpty()) {
                        charge.setPatientId(Integer.parseInt(params.get("patientId")));
                    }
                    if (params.get("patientName") != null) charge.setPatientName(params.get("patientName"));
                    if (params.get("chargeType") != null) charge.setChargeType(params.get("chargeType"));
                    String relateIdStr = params.get("relateId") != null ? params.get("relateId") : params.get("prescriptionId");
                    if (relateIdStr != null && !relateIdStr.isEmpty()) {
                        charge.setRelateId(Integer.parseInt(relateIdStr));
                    }
                    if (params.get("totalFee") != null && !params.get("totalFee").isEmpty()) {
                        charge.setTotalFee(new java.math.BigDecimal(params.get("totalFee")));
                    } else if (params.get("totalAmount") != null && !params.get("totalAmount").isEmpty()) {
                        charge.setTotalFee(new java.math.BigDecimal(params.get("totalAmount")));
                    }
                    if (params.get("operator") != null) charge.setOperator(params.get("operator"));
                    if (params.get("paymentType") != null) charge.setPaymentType(params.get("paymentType"));
                    else if (params.get("paymentMethod") != null) charge.setPaymentType(params.get("paymentMethod"));
                    if (charge.getChargeTime() == null) charge.setChargeTime(new java.util.Date());
                    if (charge.getStatus() == null) charge.setStatus("paid");
                    if (params.get("status") != null) charge.setStatus(params.get("status"));
                    int chargeId = new ChargeService().charge(charge);
                    System.out.println("[DEBUG] charge result = " + chargeId);
                    if (chargeId > 0) {
                        String itemsStr = params.get("items");
                        if (itemsStr != null && !itemsStr.isEmpty()) {
                            java.util.List<java.util.Map<String, Object>> itemList = parseJsonArray(itemsStr);
                            ChargeItemService chargeItemService = new ChargeItemService();
                            for (java.util.Map<String, Object> itemParams : itemList) {
                                ChargeItem ci = new ChargeItem();
                                ci.setChargeId(chargeId);
                                ci.setItemType(itemParams.get("itemType") != null ? itemParams.get("itemType").toString() : null);
                                if (itemParams.get("relateId") != null && !itemParams.get("relateId").toString().isEmpty()) {
                                    ci.setRelateId(Integer.parseInt(itemParams.get("relateId").toString()));
                                }
                                ci.setItemName(itemParams.get("itemName") != null ? itemParams.get("itemName").toString() : null);
                                if (itemParams.get("quantity") != null && !itemParams.get("quantity").toString().isEmpty()) {
                                    ci.setQuantity(Integer.parseInt(itemParams.get("quantity").toString()));
                                } else {
                                    ci.setQuantity(1);
                                }
                                if (itemParams.get("unitPrice") != null && !itemParams.get("unitPrice").toString().isEmpty()) {
                                    ci.setUnitPrice(new java.math.BigDecimal(itemParams.get("unitPrice").toString()));
                                }
                                if (itemParams.get("totalPrice") != null && !itemParams.get("totalPrice").toString().isEmpty()) {
                                    ci.setTotalPrice(new java.math.BigDecimal(itemParams.get("totalPrice").toString()));
                                }
                                chargeItemService.addChargeItem(ci);
                                System.out.println("[DEBUG] added charge item: " + ci.getItemType() + " " + ci.getItemName());
                            }
                        }
                        if ("prescription".equals(charge.getChargeType())) {
                            int prescriptionRelateId = charge.getRelateId();
                            if (prescriptionRelateId <= 0 && itemsStr != null && !itemsStr.isEmpty()) {
                                java.util.List<java.util.Map<String, Object>> itemList3 = parseJsonArray(itemsStr);
                                for (java.util.Map<String, Object> itemParams : itemList3) {
                                    if ("prescription".equals(itemParams.get("itemType") != null ? itemParams.get("itemType").toString() : null) && itemParams.get("relateId") != null) {
                                        prescriptionRelateId = Integer.parseInt(itemParams.get("relateId").toString());
                                        break;
                                    }
                                }
                            }
                            if (prescriptionRelateId > 0) {
                                PrescriptionService prescriptionService = new PrescriptionService();
                                Prescription prescription = new Prescription();
                                prescription.setId(prescriptionRelateId);
                                prescription.setStatus("paid");
                                System.out.println("[DEBUG] updating prescription " + prescription.getId() + " status to paid");
                                prescriptionService.updatePrescription(prescription);
                            }
                        }
                        if ("registration".equals(charge.getChargeType())) {
                            int regRelateId = charge.getRelateId();
                            if (regRelateId <= 0 && itemsStr != null && !itemsStr.isEmpty()) {
                                java.util.List<java.util.Map<String, Object>> itemList4 = parseJsonArray(itemsStr);
                                for (java.util.Map<String, Object> itemParams : itemList4) {
                                    if ("registration".equals(itemParams.get("itemType") != null ? itemParams.get("itemType").toString() : null) && itemParams.get("relateId") != null) {
                                        regRelateId = Integer.parseInt(itemParams.get("relateId").toString());
                                        break;
                                    }
                                }
                            }
                            if (regRelateId > 0) {
                                RegistrationService registrationService = new RegistrationService();
                                Registration registration = new Registration();
                                registration.setId(regRelateId);
                                registration.setRegStatus("paid");
                                System.out.println("[DEBUG] updating registration " + registration.getId() + " status to paid");
                                registrationService.updateRegistration(registration);
                            }
                        }
                        if (itemsStr != null && !itemsStr.isEmpty()) {
                            java.util.List<java.util.Map<String, Object>> itemList2 = parseJsonArray(itemsStr);
                            PrescriptionExaminationService peService = new PrescriptionExaminationService();
                            for (java.util.Map<String, Object> itemParams : itemList2) {
                                if ("examination".equals(itemParams.get("itemType") != null ? itemParams.get("itemType").toString() : null) && itemParams.get("relateId") != null) {
                                    int examRelateId = Integer.parseInt(itemParams.get("relateId").toString());
                                    peService.updateStatus(examRelateId, "paid");
                                    System.out.println("[DEBUG] updating prescription_examination " + examRelateId + " status to paid");
                                }
                            }
                        }
                    }
                    if (chargeId > 0) {
                        new AuditLogService().record(
                            "charge_pay",
                            "charge",
                            (long) chargeId,
                            charge.getPatientId() > 0 ? (long) charge.getPatientId() : null,
                            "收费结算",
                            charge.getOperator(),
                            String.valueOf(exchange.getRemoteAddress()),
                            true,
                            "完成收费: " + charge.getChargeType() + " 金额 " + charge.getTotalFee()
                        );
                    }
                    sendResponse(exchange, "{\"success\":" + (chargeId > 0) + ",\"id\":" + chargeId + "}");
                } else if ("/api/charges/refund".equals(path) && "POST".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    System.out.println("[DEBUG] refundCharge received params:");
                    for (Map.Entry<String, String> entry : params.entrySet()) {
                        System.out.println("  " + entry.getKey() + " = " + entry.getValue());
                    }
                    String chargeIdStr = params.get("id") != null ? params.get("id") : params.get("chargeId");
                    int chargeId = Integer.parseInt(chargeIdStr);
                    String operator = params.get("operator");
                    System.out.println("[DEBUG] chargeId = " + chargeId + ", operator = " + operator);
                    ChargeService chargeService = new ChargeService();
                    Charge charge = chargeService.getChargeById(chargeId);
                    System.out.println("[DEBUG] charge found: " + (charge != null) + ", status = " + (charge != null ? charge.getStatus() : "null"));
                    if (charge == null) {
                        sendError(exchange, 404, "Charge not found");
                        return;
                    }
                    if ("refunded".equals(charge.getStatus())) {
                        sendError(exchange, 400, "Already refunded");
                        return;
                    }
                    Charge updateCharge = new Charge();
                    updateCharge.setId(chargeId);
                    updateCharge.setStatus("refunded");
                    int result = chargeService.updateCharge(updateCharge);
                    System.out.println("[DEBUG] updateCharge result = " + result);
                    if ("prescription".equals(charge.getChargeType())) {
                        System.out.println("[DEBUG] updating prescription status, relateId = " + charge.getRelateId());
                        PrescriptionService prescriptionService = new PrescriptionService();
                        Prescription prescription = new Prescription();
                        prescription.setId(charge.getRelateId());
                        prescription.setStatus("voided");
                        prescriptionService.updatePrescription(prescription);
                    }
                    if ("registration".equals(charge.getChargeType())) {
                        System.out.println("[DEBUG] updating registration status, relateId = " + charge.getRelateId());
                        RegistrationService registrationService = new RegistrationService();
                        Registration registration = new Registration();
                        registration.setId(charge.getRelateId());
                        registration.setRegStatus("pending");
                        registrationService.updateRegistration(registration);
                    }
                    ChargeItemService chargeItemService = new ChargeItemService();
                    java.util.List<ChargeItem> chargeItems = chargeItemService.getByChargeId(chargeId);
                    PrescriptionExaminationService peService = new PrescriptionExaminationService();
                    for (ChargeItem ci : chargeItems) {
                        if ("examination".equals(ci.getItemType())) {
                            peService.updateStatus(ci.getRelateId(), "pending");
                            System.out.println("[DEBUG] reverting prescription_examination " + ci.getRelateId() + " status to pending");
                        }
                    }
                    new AuditLogService().record(
                        "charge_refund",
                        "charge",
                        (long) chargeId,
                        charge.getPatientId() > 0 ? (long) charge.getPatientId() : null,
                        "收费结算",
                        operator,
                        String.valueOf(exchange.getRemoteAddress()),
                        true,
                        "完成退费: " + charge.getChargeType() + " 金额 " + charge.getTotalFee()
                    );
                    sendResponse(exchange, "{\"success\":true}");
                } else if ("/api/charges".equals(path) && "GET".equals(method)) {
                    String query = exchange.getRequestURI().getQuery();
                    List<Charge> charges;
                    if (query != null && query.contains("patientId=")) {
                        String patientIdStr = query.substring(query.indexOf("patientId=") + 10);
                        try {
                            patientIdStr = java.net.URLDecoder.decode(patientIdStr, "UTF-8");
                            int patientId = Integer.parseInt(patientIdStr);
                            charges = new ChargeService().getChargesByPatientId(patientId);
                        } catch (Exception e) {
                            charges = new ChargeService().getAllCharges();
                        }
                    } else {
                        charges = new ChargeService().getAllCharges();
                    }
                    sendResponse(exchange, "{\"charges\":" + toJson(charges) + ",\"count\":" + charges.size() + "}");
                } else if (path.matches("/api/charges/\\d+") && "GET".equals(method)) {
                    int chargeId = Integer.parseInt(path.substring(path.lastIndexOf('/') + 1));
                    Charge charge = new ChargeService().getChargeById(chargeId);
                    if (charge == null) {
                        sendError(exchange, 404, "Charge not found");
                        return;
                    }
                    List<ChargeItem> items = new ChargeItemService().getByChargeId(chargeId);
                    String json = toJson(charge);
                    if (json.endsWith("}")) {
                        json = json.substring(0, json.length() - 1) + ",\"items\":" + toJson(items) + "}";
                    }
                    sendResponse(exchange, json);
                } else if ("/api/charges/status".equals(path) && "PUT".equals(method)) {
                    String body = getRequestBody(exchange);
                    Map<String, String> params = parseJson(body);
                    String idStr = params.get("id") != null ? params.get("id") : params.get("chargeId");
                    if (idStr != null && !idStr.isEmpty()) {
                        int chargeId = Integer.parseInt(idStr);
                        String status = params.get("status");
                        ChargeService chargeService = new ChargeService();
                        Charge updateCharge = new Charge();
                        updateCharge.setId(chargeId);
                        updateCharge.setStatus(status);
                        int result = chargeService.updateCharge(updateCharge);
                        sendResponse(exchange, "{\"success\":" + (result > 0) + "}");
                    } else {
                        sendError(exchange, 400, "Missing charge id");
                    }
                } else if (path.matches("/api/charges/\\d+/items") && "GET".equals(method)) {
                    java.util.regex.Pattern p = java.util.regex.Pattern.compile("/api/charges/(\\d+)/items");
                    java.util.regex.Matcher m = p.matcher(path);
                    if (m.find()) {
                        int chargeId = Integer.parseInt(m.group(1));
                        List<ChargeItem> items = new ChargeItemService().getByChargeId(chargeId);
                        sendResponse(exchange, "{\"items\":" + toJson(items) + ",\"count\":" + items.size() + "}");
                    } else {
                        sendError(exchange, 400, "Invalid path");
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
