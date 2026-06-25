package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.PrescriptionEnhanced;
import bean.Drug;
import bean.InventoryLog;
import bean.PrescriptionItem;
import bean.Prescription;
import service.DrugService;
import service.InventoryLogService;
import service.PrescriptionItemService;
import service.PrescriptionService;
import util.JDBCUtil;
import java.util.Map;
import java.math.BigDecimal;
import java.sql.ResultSet;

public class PrescriptionEnhancedHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath(); String method = exchange.getRequestMethod();
            dao.impl.PrescriptionEnhancedDAOImpl dao = new dao.impl.PrescriptionEnhancedDAOImpl();
            if ("GET".equals(method)) {
                String q = exchange.getRequestURI().getQuery(); int page=1,size=20; String status="";
                if (q!=null) for(String p:q.split("&")){String[]kv=p.split("=");if(kv.length==2){
                    if("page".equals(kv[0]))page=Integer.parseInt(kv[1]);else if("size".equals(kv[0]))size=Integer.parseInt(kv[1]);
                    else if("status".equals(kv[0]))status=kv[1];else if("patientId".equals(kv[0])){
                        sendResponse(exchange,"{\"items\":"+dao.findPrescriptionsByPatientId(Integer.parseInt(kv[1]))+"}");return;
                    }else if("prescriptionNo".equals(kv[0])){
                        PrescriptionEnhanced pe=dao.findByPrescriptionNo(kv[1]);sendResponse(exchange,pe!=null?toJson(pe):"null");return;
                    }}
                }
                String prescStatus = status!=null && !status.isEmpty()?status:null;
                sendResponse(exchange, "{\"items\":"+dao.findAllPrescriptions(prescStatus,page,size)+"}");
            } else if ("POST".equals(method)) {
                Map<String,String> params = parseJson(getRequestBody(exchange));
                PrescriptionEnhanced p = new PrescriptionEnhanced();
                p.setPrescriptionNo(params.getOrDefault("prescriptionNo","RX"+System.currentTimeMillis()));
                p.setPatientId(getIntParam(params,"patientId"));p.setPatientName(params.get("patientName"));
                p.setMedicalRecordNo(params.get("medicalRecordNo"));p.setVisitNo(params.get("visitNo"));
                p.setDoctorId(getIntParam(params,"doctorId"));p.setDoctorName(params.get("doctorName"));
                p.setDeptId(getIntParam(params,"deptId"));p.setDeptName(params.get("deptName"));
                p.setPrescriptionType(params.get("prescriptionType"));p.setDiagnosis(params.get("diagnosis"));
                p.setPrescriptionDate(new java.sql.Timestamp(System.currentTimeMillis()));
                p.setTotalAmount(new java.math.BigDecimal(params.getOrDefault("totalAmount","0")));
                p.setStatus(params.getOrDefault("status","待审核"));
                int id = dao.insert(p); sendResponse(exchange, "{\"success\":"+(id>0)+",\"id\":"+id+"}");
            } else if (path.matches("/api/prescriptions-enhanced/\\d+") && "PUT".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                Map<String,String> params = parseJson(getRequestBody(exchange));
                PrescriptionEnhanced p = new PrescriptionEnhanced(); p.setId(id);
                p.setStatus(params.get("status"));p.setReviewerId(getIntParamOrNull(params,"reviewerId"));
                p.setReviewerName(params.get("reviewerName"));p.setReviewTime(new java.sql.Timestamp(System.currentTimeMillis()));
                p.setReviewOpinion(params.get("reviewOpinion"));p.setDispenserId(getIntParamOrNull(params,"dispenserId"));
                p.setDispenserName(params.get("dispenserName"));
                if("已发药".equals(params.get("status"))){
                    p.setDispenseTime(new java.sql.Timestamp(System.currentTimeMillis()));
                    dispenseDrugs(id, p.getDispenserName());
                }
                dao.update(p); sendResponse(exchange, "{\"success\":true}");
            } else if (path.matches("/api/prescriptions-enhanced/\\d+") && "DELETE".equals(method)) {
                int id = Integer.parseInt(path.substring(path.lastIndexOf('/')+1));
                PrescriptionEnhanced p = new PrescriptionEnhanced(); p.setId(id);
                p.setStatus("作废");
                dao.update(p); sendResponse(exchange, "{\"success\":true}");
            }
        }

        private void dispenseDrugs(int prescriptionId, String operator) {
            PrescriptionItemService piService = new PrescriptionItemService();
            DrugService drugService = new DrugService();
            InventoryLogService logService = new InventoryLogService();
            java.util.List<PrescriptionItem> items = piService.getPrescriptionItemsByPrescriptionId(prescriptionId);

            if (items.isEmpty()) {
                String sql = "SELECT patient_id, prescription_date FROM prescription_enhanced WHERE id = ?";
                try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, prescriptionId)) {
                    ResultSet rs = qr.getResultSet();
                    if (rs.next()) {
                        int patientId = rs.getInt("patient_id");
                        java.sql.Timestamp peDate = rs.getTimestamp("prescription_date");
                        java.util.List<Prescription> basicList = new PrescriptionService().getPrescriptionsByPatientId(patientId);
                        for (Prescription bp : basicList) {
                            if (bp.getCreateTime() != null && peDate != null) {
                                long diff = Math.abs(peDate.getTime() - bp.getCreateTime().getTime());
                                if (diff < 86400000) {
                                    items = piService.getPrescriptionItemsByPrescriptionId(bp.getId());
                                    if (!items.isEmpty()) {
                                        System.out.println("[DEBUG] dispenseDrugs: matched basic prescription id=" + bp.getId() + " items=" + items.size());
                                        break;
                                    }
                                }
                            }
                        }
                    }
                } catch (Exception e) {
                    System.out.println("[WARN] dispenseDrugs cross-table lookup failed: " + e.getMessage());
                }
            }

            if (items.isEmpty()) {
                System.out.println("[INFO] dispenseDrugs: no items found, skip stock deduction (prescriptionId=" + prescriptionId + ")");
                return;
            }

            for (PrescriptionItem item : items) {
                Drug drug = drugService.getDrugById(item.getDrugId());
                if (drug != null) {
                    int oldStock = drug.getStock();
                    int newStock = oldStock - item.getNum();
                    drug.setStock(Math.max(newStock, 0));
                    drugService.updateDrug(drug);
                    InventoryLog log = new InventoryLog();
                    log.setDrugId(item.getDrugId());
                    log.setChangeType("out");
                    log.setChangeNum(item.getNum());
                    log.setBeforeStock(oldStock);
                    log.setAfterStock(Math.max(newStock, 0));
                    log.setOperator(operator != null ? operator : "药师");
                    log.setReason("发药 - 处方ID: " + prescriptionId);
                    logService.addInventoryLog(log);
                }
            }
            System.out.println("[INFO] dispenseDrugs: completed, prescriptionId=" + prescriptionId + " drugs=" + items.size());
        }
}
