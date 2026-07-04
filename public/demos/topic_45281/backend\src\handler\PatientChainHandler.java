package handler;

import com.sun.net.httpserver.HttpExchange;
import java.io.IOException;
import bean.Patient;
import bean.Examination;
import service.PatientService;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import util.JDBCUtil;
import java.util.stream.Collectors;

public class PatientChainHandler extends BaseHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String path = exchange.getRequestURI().getPath();
            String method = exchange.getRequestMethod();
            if ("GET".equals(method) && path.matches("/api/patient-chain/\\d+")) {
                int patientId = Integer.parseInt(path.substring("/api/patient-chain/".length()));
                java.util.Map<String, Object> chain = new java.util.LinkedHashMap<>();
                try {
                    Patient patient = new PatientService().getPatientById(patientId);
                    chain.put("patient", patient);
                } catch (Exception e) { e.printStackTrace(); chain.put("patient", null); }

                try {
                    List<Map<String, Object>> outpatientList = new ArrayList<>();
                    JDBCUtil.QueryResult omrResult = JDBCUtil.executeQuery(
                        "SELECT id,visit_no,doctor_name,dept_name,visit_date,visit_type,chief_complaint,diagnosis,status FROM outpatient_medical_record WHERE patient_id=? ORDER BY visit_date DESC", patientId);
                    List<Integer> omrIds = new ArrayList<>();
                    if (omrResult != null) {
                    java.sql.ResultSet omrRs = omrResult.getResultSet();
                    while (omrRs.next()) {
                        java.util.Map<String, Object> omr = new java.util.LinkedHashMap<>();
                        int omrId = omrRs.getInt("id");
                        omr.put("id", omrId); omr.put("visitNo", omrRs.getString("visit_no"));
                        omr.put("doctorName", omrRs.getString("doctor_name")); omr.put("deptName", omrRs.getString("dept_name"));
                        omr.put("visitDate", omrRs.getString("visit_date")); omr.put("visitType", omrRs.getString("visit_type"));
                        omr.put("chiefComplaint", omrRs.getString("chief_complaint"));
                        omr.put("diagnosis", omrRs.getString("diagnosis")); omr.put("status", omrRs.getString("status"));
                        omr.put("prescriptions", new ArrayList<Map<String, Object>>());
                        omrIds.add(omrId);
                        outpatientList.add(omr);
                    }
                    omrResult.close();
                    }

                    Map<Integer, Map<String, Object>> omrMap = new java.util.LinkedHashMap<>();
                    for (Map<String, Object> omr : outpatientList) {
                        omrMap.put((Integer) omr.get("id"), omr);
                    }

                    if (!omrIds.isEmpty()) {
                        List<Map<String, Object>> allPrescs = new ArrayList<>();
                        Map<Integer, Integer> prescToOmrIdx = new java.util.HashMap<>();
                        List<Integer> prescIds = new ArrayList<>();
                        if (!omrIds.isEmpty()) {
                            String placeholders = omrIds.stream().map(i -> "?").collect(java.util.stream.Collectors.joining(","));
                            String prescSql = "SELECT id,prescription_no,diagnosis,total_amount,status,prescription_date,reviewer_name,dispense_time,outpatient_record_id FROM prescription_enhanced WHERE patient_id=? AND outpatient_record_id IN (" + placeholders + ") ORDER BY prescription_date DESC";
                            List<Object> prescParams = new ArrayList<>();
                            prescParams.add(patientId);
                            prescParams.addAll(omrIds);
                            JDBCUtil.QueryResult prResult = JDBCUtil.executeQuery(prescSql, prescParams.toArray());
                            if (prResult != null) {
                            java.sql.ResultSet prRs = prResult.getResultSet();
                            while (prRs.next()) {
                                java.util.Map<String, Object> p = new java.util.LinkedHashMap<>();
                                int prescId = prRs.getInt("id");
                                p.put("id", prescId); p.put("prescriptionNo", prRs.getString("prescription_no"));
                                p.put("diagnosis", prRs.getString("diagnosis")); p.put("totalAmount", prRs.getBigDecimal("total_amount"));
                                p.put("status", prRs.getString("status")); p.put("prescriptionDate", prRs.getString("prescription_date"));
                                p.put("reviewerName", prRs.getString("reviewer_name")); p.put("dispenseTime", prRs.getString("dispense_time"));
                                p.put("details", new ArrayList<Map<String, Object>>());
                                p.put("examinations", new ArrayList<Map<String, Object>>());
                                int omrId = prRs.getInt("outpatient_record_id");
                                p.put("_omrId", omrId);
                                prescIds.add(prescId);
                                allPrescs.add(p);
                            }
                            prResult.close();
                            }

                            if (!prescIds.isEmpty()) {
                                String pdPlaceholders = prescIds.stream().map(i -> "?").collect(java.util.stream.Collectors.joining(","));
                                String detailSql = "SELECT prescription_id,drug_name,drug_spec,dosage,dosage_unit,frequency,route,quantity,unit,unit_price,amount,days,dispensed_quantity,dispense_status FROM prescription_detail WHERE prescription_id IN (" + pdPlaceholders + ")";
                                JDBCUtil.QueryResult pdResult = JDBCUtil.executeQuery(detailSql, prescIds.toArray());
                                Map<Integer, List<Map<String, Object>>> detailMap = new java.util.HashMap<>();
                                if (pdResult != null) {
                                java.sql.ResultSet pdRs = pdResult.getResultSet();
                                while (pdRs.next()) {
                                    java.util.Map<String, Object> d = new java.util.LinkedHashMap<>();
                                    int pId = pdRs.getInt("prescription_id");
                                    d.put("drugName", pdRs.getString("drug_name")); d.put("drugSpec", pdRs.getString("drug_spec"));
                                    d.put("dosage", pdRs.getString("dosage")); d.put("dosageUnit", pdRs.getString("dosage_unit"));
                                    d.put("frequency", pdRs.getString("frequency")); d.put("route", pdRs.getString("route"));
                                    d.put("quantity", pdRs.getInt("quantity")); d.put("unit", pdRs.getString("unit"));
                                    d.put("unitPrice", pdRs.getBigDecimal("unit_price")); d.put("amount", pdRs.getBigDecimal("amount"));
                                    d.put("days", pdRs.getInt("days")); d.put("dispensedQuantity", pdRs.getInt("dispensed_quantity"));
                                    d.put("dispenseStatus", pdRs.getString("dispense_status"));
                                    detailMap.computeIfAbsent(pId, k -> new ArrayList<>()).add(d);
                                }
                                pdResult.close();
                                }
                                for (Map<String, Object> p : allPrescs) {
                                    List<Map<String, Object>> details = detailMap.get((Integer) p.get("id"));
                                    if (details != null) p.put("details", details);
                                }

                                String examSql = "SELECT pe.prescription_id,pe.examination_id,e.name,e.category,e.price,pe.status,pe.result FROM prescription_examination pe JOIN examination e ON pe.examination_id=e.id WHERE pe.prescription_id IN (" + pdPlaceholders + ")";
                                JDBCUtil.QueryResult peResult = JDBCUtil.executeQuery(examSql, prescIds.toArray());
                                Map<Integer, List<Map<String, Object>>> examMap = new java.util.HashMap<>();
                                if (peResult != null) {
                                java.sql.ResultSet peRs = peResult.getResultSet();
                                while (peRs.next()) {
                                    java.util.Map<String, Object> eMap = new java.util.LinkedHashMap<>();
                                    int pId = peRs.getInt("prescription_id");
                                    eMap.put("examName", peRs.getString("name")); eMap.put("category", peRs.getString("category"));
                                    eMap.put("price", peRs.getBigDecimal("price")); eMap.put("status", peRs.getString("status"));
                                    eMap.put("result", peRs.getString("result"));
                                    examMap.computeIfAbsent(pId, k -> new ArrayList<>()).add(eMap);
                                }
                                peResult.close();
                                }
                                for (Map<String, Object> p : allPrescs) {
                                    List<Map<String, Object>> exams = examMap.get((Integer) p.get("id"));
                                    if (exams != null) p.put("examinations", exams);
                                }
                            }

                            for (Map<String, Object> p : allPrescs) {
                                Integer omrId = (Integer) p.remove("_omrId");
                                Map<String, Object> omr = omrMap.get(omrId);
                                if (omr != null) {
                                    @SuppressWarnings("unchecked")
                                    List<Map<String, Object>> plist = (List<Map<String, Object>>) omr.get("prescriptions");
                                    plist.add(p);
                                }
                            }
                        }
                    }
                    chain.put("outpatientRecords", outpatientList);
                } catch (Exception e) { e.printStackTrace(); chain.put("outpatientRecords", new ArrayList<>()); }

                try {
                    List<Map<String, Object>> admissionList = new ArrayList<>();
                    JDBCUtil.QueryResult iaResult = JDBCUtil.executeQuery(
                        "SELECT id,admission_no,admission_date,discharge_date,bed_no,deposit,dept_name,ward_name,attending_doctor_name,admission_type,admission_diagnosis,nursing_level,total_cost,paid_amount,status FROM inpatient_admission WHERE patient_id=? ORDER BY admission_date DESC", patientId);
                    List<Integer> admIds = new ArrayList<>();
                    if (iaResult != null) {
                    java.sql.ResultSet iaRs = iaResult.getResultSet();
                    while (iaRs.next()) {
                        java.util.Map<String, Object> adm = new java.util.LinkedHashMap<>();
                        int admId = iaRs.getInt("id");
                        adm.put("id", admId); adm.put("admissionNo", iaRs.getString("admission_no"));
                        adm.put("admissionDate", iaRs.getString("admission_date")); adm.put("dischargeDate", iaRs.getString("discharge_date"));
                        adm.put("bedNo", iaRs.getString("bed_no")); adm.put("bedType", "");
                        adm.put("dailyRate", iaRs.getBigDecimal("deposit"));
                        adm.put("deptName", iaRs.getString("dept_name")); adm.put("wardName", iaRs.getString("ward_name"));
                        adm.put("attendingDoctorName", iaRs.getString("attending_doctor_name"));
                        adm.put("admissionType", iaRs.getString("admission_type"));
                        adm.put("admissionDiagnosis", iaRs.getString("admission_diagnosis"));
                        adm.put("nursingLevel", iaRs.getString("nursing_level"));
                        adm.put("deposit", iaRs.getBigDecimal("deposit")); adm.put("totalCost", iaRs.getBigDecimal("total_cost"));
                        adm.put("paidAmount", iaRs.getBigDecimal("paid_amount")); adm.put("status", iaRs.getString("status"));
                        adm.put("orders", new ArrayList<Map<String, Object>>());
                        adm.put("nursingRecords", new ArrayList<Map<String, Object>>());
                        adm.put("charges", new ArrayList<Map<String, Object>>());
                        adm.put("qualityControls", new ArrayList<Map<String, Object>>());
                        admIds.add(admId);
                        admissionList.add(adm);
                    }
                    iaResult.close();

                    if (!admIds.isEmpty()) {
                        String admPlaceholders = admIds.stream().map(i -> "?").collect(java.util.stream.Collectors.joining(","));
                        List<Object> admIdParams = new ArrayList<>(admIds);

                        JDBCUtil.QueryResult ioResult = JDBCUtil.executeQuery(
                            "SELECT id,inpatient_admission_id,order_type,category,order_content,drug_name,dosage,dosage_unit,frequency,route,start_time,doctor_name,status,priority,stop_time FROM inpatient_order WHERE inpatient_admission_id IN (" + admPlaceholders + ") ORDER BY start_time DESC", admIdParams.toArray());
                        if (ioResult != null) {
                        java.sql.ResultSet ioRs = ioResult.getResultSet();
                        Map<Integer, List<Map<String, Object>>> orderMap = new java.util.HashMap<>();
                        while (ioRs.next()) {
                            java.util.Map<String, Object> o = new java.util.LinkedHashMap<>();
                            o.put("id", ioRs.getInt("id")); o.put("orderType", ioRs.getString("order_type"));
                            o.put("category", ioRs.getString("category")); o.put("orderContent", ioRs.getString("order_content"));
                            o.put("drugName", ioRs.getString("drug_name")); o.put("dosage", ioRs.getString("dosage"));
                            o.put("dosageUnit", ioRs.getString("dosage_unit")); o.put("frequency", ioRs.getString("frequency"));
                            o.put("route", ioRs.getString("route")); o.put("startTime", ioRs.getString("start_time"));
                            o.put("doctorName", ioRs.getString("doctor_name")); o.put("status", ioRs.getString("status"));
                            o.put("priority", ioRs.getString("priority")); o.put("stopTime", ioRs.getString("stop_time"));
                            orderMap.computeIfAbsent(ioRs.getInt("inpatient_admission_id"), k -> new ArrayList<>()).add(o);
                        }
                        ioResult.close();
                        for (Map<String, Object> adm : admissionList) {
                            List<Map<String, Object>> orders = orderMap.get((Integer) adm.get("id"));
                            if (orders != null) adm.put("orders", orders);
                        }
                        }

                        JDBCUtil.QueryResult nrResult = JDBCUtil.executeQuery(
                            "SELECT id,inpatient_admission_id,record_type,record_time,record_level,nurse_name,vital_signs,consciousness,diet,intake_amount,output_amount,condition_description,nursing_measures,fall_risk_score,pressure_injury_risk_score,pain_score FROM nursing_record WHERE inpatient_admission_id IN (" + admPlaceholders + ") ORDER BY record_time DESC", admIdParams.toArray());
                        if (nrResult != null) {
                        java.sql.ResultSet nrRs = nrResult.getResultSet();
                        Map<Integer, List<Map<String, Object>>> nursingMap = new java.util.HashMap<>();
                        while (nrRs.next()) {
                            java.util.Map<String, Object> n = new java.util.LinkedHashMap<>();
                            n.put("id", nrRs.getInt("id")); n.put("recordType", nrRs.getString("record_type"));
                            n.put("recordTime", nrRs.getString("record_time")); n.put("recordLevel", nrRs.getString("record_level"));
                            n.put("nurseName", nrRs.getString("nurse_name")); n.put("vitalSigns", nrRs.getString("vital_signs"));
                            n.put("consciousness", nrRs.getString("consciousness")); n.put("diet", nrRs.getString("diet"));
                            n.put("intakeAmount", nrRs.getBigDecimal("intake_amount")); n.put("outputAmount", nrRs.getBigDecimal("output_amount"));
                            n.put("conditionDescription", nrRs.getString("condition_description"));
                            n.put("nursingMeasures", nrRs.getString("nursing_measures"));
                            n.put("fallRiskScore", nrRs.getInt("fall_risk_score"));
                            n.put("pressureInjuryRiskScore", nrRs.getInt("pressure_injury_risk_score"));
                            n.put("painScore", nrRs.getInt("pain_score"));
                            nursingMap.computeIfAbsent(nrRs.getInt("inpatient_admission_id"), k -> new ArrayList<>()).add(n);
                        }
                        nrResult.close();
                        for (Map<String, Object> adm : admissionList) {
                            List<Map<String, Object>> records = nursingMap.get((Integer) adm.get("id"));
                            if (records != null) adm.put("nursingRecords", records);
                        }
                        }

                        JDBCUtil.QueryResult fcResult = JDBCUtil.executeQuery(
                            "SELECT id,inpatient_admission_id,charge_no,charge_type,total_amount,self_pay_amount,actual_amount,payment_method,charge_items,charger_name,charge_time,status FROM finance_charge WHERE inpatient_admission_id IN (" + admPlaceholders + ") ORDER BY charge_time DESC", admIdParams.toArray());
                        if (fcResult != null) {
                        java.sql.ResultSet fcRs = fcResult.getResultSet();
                        Map<Integer, List<Map<String, Object>>> chargeMap = new java.util.HashMap<>();
                        while (fcRs.next()) {
                            java.util.Map<String, Object> c = new java.util.LinkedHashMap<>();
                            c.put("id", fcRs.getInt("id")); c.put("chargeNo", fcRs.getString("charge_no"));
                            c.put("chargeType", fcRs.getString("charge_type")); c.put("totalAmount", fcRs.getBigDecimal("total_amount"));
                            c.put("selfPayAmount", fcRs.getBigDecimal("self_pay_amount")); c.put("actualAmount", fcRs.getBigDecimal("actual_amount"));
                            c.put("paymentMethod", fcRs.getString("payment_method")); c.put("chargeItems", fcRs.getString("charge_items"));
                            c.put("chargerName", fcRs.getString("charger_name")); c.put("chargeTime", fcRs.getString("charge_time"));
                            c.put("status", fcRs.getString("status"));
                            chargeMap.computeIfAbsent(fcRs.getInt("inpatient_admission_id"), k -> new ArrayList<>()).add(c);
                        }
                        fcResult.close();
                        for (Map<String, Object> adm : admissionList) {
                            List<Map<String, Object>> charges = chargeMap.get((Integer) adm.get("id"));
                            if (charges != null) adm.put("charges", charges);
                        }
                        }

                        JDBCUtil.QueryResult qcResult = JDBCUtil.executeQuery(
                            "SELECT id,inpatient_admission_id,qc_type,qc_item,result,score,full_score,problem_description,qc_person_name,qc_time,rectify_status FROM medical_quality_control WHERE inpatient_admission_id IN (" + admPlaceholders + ") ORDER BY qc_time DESC", admIdParams.toArray());
                        if (qcResult != null) {
                        java.sql.ResultSet qcRs = qcResult.getResultSet();
                        Map<Integer, List<Map<String, Object>>> qcMap = new java.util.HashMap<>();
                        while (qcRs.next()) {
                            java.util.Map<String, Object> q = new java.util.LinkedHashMap<>();
                            q.put("id", qcRs.getInt("id")); q.put("qcType", qcRs.getString("qc_type"));
                            q.put("qcItem", qcRs.getString("qc_item")); q.put("result", qcRs.getString("result"));
                            q.put("score", qcRs.getInt("score")); q.put("fullScore", qcRs.getInt("full_score"));
                            q.put("problemDescription", qcRs.getString("problem_description"));
                            q.put("qcPersonName", qcRs.getString("qc_person_name")); q.put("qcTime", qcRs.getString("qc_time"));
                            q.put("rectifyStatus", qcRs.getString("rectify_status"));
                            qcMap.computeIfAbsent(qcRs.getInt("inpatient_admission_id"), k -> new ArrayList<>()).add(q);
                        }
                        qcResult.close();
                        for (Map<String, Object> adm : admissionList) {
                            List<Map<String, Object>> qcs = qcMap.get((Integer) adm.get("id"));
                            if (qcs != null) adm.put("qualityControls", qcs);
                        }
                        }
                    }
                    }
                    chain.put("inpatientAdmissions", admissionList);
                } catch (Exception e) { e.printStackTrace(); chain.put("inpatientAdmissions", new ArrayList<>()); }

                    List<Map<String, Object>> allCharges = new ArrayList<>();
                    try {
                    JDBCUtil.QueryResult acResult = JDBCUtil.executeQuery(
                        "SELECT id,charge_no,charge_type,total_amount,actual_amount,payment_method,charge_time,status,prescription_id,inpatient_admission_id FROM finance_charge WHERE patient_id=? ORDER BY charge_time DESC", patientId);
                    if (acResult != null) {
                    java.sql.ResultSet acRs = acResult.getResultSet();
                    while (acRs.next()) {
                        java.util.Map<String, Object> c = new java.util.LinkedHashMap<>();
                        c.put("id", acRs.getInt("id")); c.put("chargeNo", acRs.getString("charge_no"));
                        c.put("chargeType", acRs.getString("charge_type")); c.put("totalAmount", acRs.getBigDecimal("total_amount"));
                        c.put("actualAmount", acRs.getBigDecimal("actual_amount")); c.put("paymentMethod", acRs.getString("payment_method"));
                        c.put("chargeTime", acRs.getString("charge_time")); c.put("status", acRs.getString("status"));
                        allCharges.add(c);
                    }
                    acResult.close();
                    }
                    } catch (Exception acEx) { acEx.printStackTrace(); chain.put("allCharges", allCharges); }
                    chain.put("allCharges", allCharges);

                    try {
                    sendResponse(exchange, "{\"success\":true,\"data\":"+toJson(chain)+"}");
                    } catch (Exception e) {
                        e.printStackTrace();
                        sendError(exchange, 500, "查询失败: " + e.getMessage());
                    }
            } else {
                sendError(exchange, 404, "Not Found");
            }
        }
}
