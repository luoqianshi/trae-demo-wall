package dao.impl;

import bean.OutpatientMedicalRecord;
import dao.OutpatientMedicalRecordDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class OutpatientMedicalRecordDAOImpl implements OutpatientMedicalRecordDAO {

    private <T> List<T> queryList(String sql, java.util.function.Function<ResultSet, T> mapper, Object... params) {
        List<T> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) {
                ResultSet rs = qr.getResultSet();
                while (rs.next()) {
                    T item = mapper.apply(rs);
                    if (item != null) {
                        list.add(item);
                    }
                }
            }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override public int insert(OutpatientMedicalRecord r) {
        return JDBCUtil.executeInsert("INSERT INTO outpatient_medical_record(patient_id,patient_name,medical_record_no,visit_no,doctor_id,doctor_name,dept_id,dept_name,visit_date,visit_type,chief_complaint,present_illness_history,past_history,personal_history,family_history,allergy_history,physical_exam,auxiliary_exam,diagnosis,icd_code,treatment_plan,advice,next_visit_date,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            r.getPatientId(), r.getPatientName(), r.getMedicalRecordNo(), r.getVisitNo(), r.getDoctorId(), r.getDoctorName(),
            r.getDeptId(), r.getDeptName(), r.getVisitDate(), r.getVisitType() != null ? r.getVisitType() : "初诊",
            r.getChiefComplaint(), r.getPresentIllnessHistory(), r.getPastHistory(), r.getPersonalHistory(),
            r.getFamilyHistory(), r.getAllergyHistory(), r.getPhysicalExam(), r.getAuxiliaryExam(),
            r.getDiagnosis(), r.getIcdCode(), r.getTreatmentPlan(), r.getAdvice(), r.getNextVisitDate(),
            r.getStatus() != null ? r.getStatus() : "进行中");
    }
    @Override public int update(OutpatientMedicalRecord r) {
        return JDBCUtil.executeUpdate("UPDATE outpatient_medical_record SET chief_complaint=?,present_illness_history=?,past_history=?,personal_history=?,family_history=?,allergy_history=?,physical_exam=?,auxiliary_exam=?,diagnosis=?,icd_code=?,treatment_plan=?,advice=?,next_visit_date=?,status=? WHERE id=?",
            r.getChiefComplaint(), r.getPresentIllnessHistory(), r.getPastHistory(), r.getPersonalHistory(),
            r.getFamilyHistory(), r.getAllergyHistory(), r.getPhysicalExam(), r.getAuxiliaryExam(),
            r.getDiagnosis(), r.getIcdCode(), r.getTreatmentPlan(), r.getAdvice(), r.getNextVisitDate(),
            r.getStatus(), r.getId());
    }
    @Override public OutpatientMedicalRecord findById(int id) {
        List<OutpatientMedicalRecord> list = queryList("SELECT * FROM outpatient_medical_record WHERE id=?", this::mapOMR, id);
        return list.isEmpty() ? null : list.get(0);
    }
    @Override public List<OutpatientMedicalRecord> findByPatientId(int patientId) {
        return queryList("SELECT * FROM outpatient_medical_record WHERE patient_id=? ORDER BY visit_date DESC", this::mapOMR, patientId);
    }
    @Override public List<OutpatientMedicalRecord> findByDoctorId(int doctorId) {
        return queryList("SELECT * FROM outpatient_medical_record WHERE doctor_id=? ORDER BY visit_date DESC", this::mapOMR, doctorId);
    }
    @Override public List<OutpatientMedicalRecord> findAll(String status, int page, int size) {
        String sql = "SELECT * FROM outpatient_medical_record";
        List<Object> params = new ArrayList<>();
        if (status != null && !status.isEmpty()) { sql += " WHERE status=?"; params.add(status); }
        sql += " ORDER BY visit_date DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        return queryList(sql, this::mapOMR, params.toArray());
    }

    private OutpatientMedicalRecord mapOMR(ResultSet rs) {
        try {
            OutpatientMedicalRecord r = new OutpatientMedicalRecord();
            r.setId(rs.getInt("id")); r.setPatientId(rs.getInt("patient_id")); r.setPatientName(rs.getString("patient_name"));
            r.setMedicalRecordNo(rs.getString("medical_record_no")); r.setVisitNo(rs.getString("visit_no"));
            r.setDoctorId(rs.getInt("doctor_id")); r.setDoctorName(rs.getString("doctor_name"));
            r.setDeptId(rs.getInt("dept_id")); r.setDeptName(rs.getString("dept_name"));
            r.setVisitDate(rs.getDate("visit_date")); r.setVisitType(rs.getString("visit_type"));
            r.setChiefComplaint(rs.getString("chief_complaint")); r.setPresentIllnessHistory(rs.getString("present_illness_history"));
            r.setPastHistory(rs.getString("past_history")); r.setPersonalHistory(rs.getString("personal_history"));
            r.setFamilyHistory(rs.getString("family_history")); r.setAllergyHistory(rs.getString("allergy_history"));
            r.setPhysicalExam(rs.getString("physical_exam")); r.setAuxiliaryExam(rs.getString("auxiliary_exam"));
            r.setDiagnosis(rs.getString("diagnosis")); r.setIcdCode(rs.getString("icd_code"));
            r.setTreatmentPlan(rs.getString("treatment_plan")); r.setAdvice(rs.getString("advice"));
            r.setNextVisitDate(rs.getDate("next_visit_date")); r.setStatus(rs.getString("status"));
            r.setCreateTime(rs.getTimestamp("create_time")); r.setUpdateTime(rs.getTimestamp("update_time"));
            return r;
        } catch (SQLException e) { return null; }
    }
}