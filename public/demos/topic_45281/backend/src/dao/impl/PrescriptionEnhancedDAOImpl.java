package dao.impl;

import bean.PrescriptionEnhanced;
import dao.PrescriptionEnhancedDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class PrescriptionEnhancedDAOImpl implements PrescriptionEnhancedDAO {

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

    @Override public int insert(PrescriptionEnhanced p) {
        return JDBCUtil.executeInsert("INSERT INTO prescription_enhanced(prescription_no,patient_id,patient_name,medical_record_no,visit_no,doctor_id,doctor_name,dept_id,dept_name,prescription_type,diagnosis,prescription_date,total_amount,status,is_emergency,is_chronic,valid_days) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            p.getPrescriptionNo(), p.getPatientId(), p.getPatientName(), p.getMedicalRecordNo(),
            p.getVisitNo(), p.getDoctorId(), p.getDoctorName(), p.getDeptId(), p.getDeptName(),
            p.getPrescriptionType() != null ? p.getPrescriptionType() : "西药", p.getDiagnosis(),
            p.getPrescriptionDate(), p.getTotalAmount(), p.getStatus() != null ? p.getStatus() : "待审核",
            p.getIsEmergency(), p.getIsChronic(), p.getValidDays());
    }
    @Override public int update(PrescriptionEnhanced p) {
        return JDBCUtil.executeUpdate("UPDATE prescription_enhanced SET status=?,reviewer_id=?,reviewer_name=?,review_time=?,review_opinion=?,dispenser_id=?,dispenser_name=?,dispense_time=?,total_amount=? WHERE id=?",
            p.getStatus(), p.getReviewerId(), p.getReviewerName(), p.getReviewTime(), p.getReviewOpinion(),
            p.getDispenserId(), p.getDispenserName(), p.getDispenseTime(), p.getTotalAmount(), p.getId());
    }
    @Override public PrescriptionEnhanced findByPrescriptionNo(String no) {
        List<PrescriptionEnhanced> list = queryList("SELECT * FROM prescription_enhanced WHERE prescription_no=?", this::mapPE, no);
        return list.isEmpty() ? null : list.get(0);
    }
    @Override public List<PrescriptionEnhanced> findPrescriptionsByPatientId(int patientId) {
        return queryList("SELECT * FROM prescription_enhanced WHERE patient_id=? ORDER BY prescription_date DESC", this::mapPE, patientId);
    }
    @Override public List<PrescriptionEnhanced> findAllPrescriptions(String status, int page, int size) {
        String sql = "SELECT * FROM prescription_enhanced";
        List<Object> params = new ArrayList<>();
        if (status != null && !status.isEmpty()) { sql += " WHERE status=?"; params.add(status); }
        sql += " ORDER BY prescription_date DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        return queryList(sql, this::mapPE, params.toArray());
    }

    private PrescriptionEnhanced mapPE(ResultSet rs) {
        try {
            PrescriptionEnhanced p = new PrescriptionEnhanced();
            p.setId(rs.getInt("id")); p.setPrescriptionNo(rs.getString("prescription_no"));
            p.setPatientId(rs.getInt("patient_id")); p.setPatientName(rs.getString("patient_name"));
            p.setMedicalRecordNo(rs.getString("medical_record_no")); p.setVisitNo(rs.getString("visit_no"));
            p.setDoctorId(rs.getInt("doctor_id")); p.setDoctorName(rs.getString("doctor_name"));
            p.setDeptId(rs.getInt("dept_id")); p.setDeptName(rs.getString("dept_name"));
            p.setPrescriptionType(rs.getString("prescription_type")); p.setDiagnosis(rs.getString("diagnosis"));
            p.setPrescriptionDate(rs.getTimestamp("prescription_date")); p.setTotalAmount(rs.getBigDecimal("total_amount"));
            p.setStatus(rs.getString("status")); p.setReviewerId(rs.getObject("reviewer_id") != null ? rs.getInt("reviewer_id") : null);
            p.setReviewerName(rs.getString("reviewer_name")); p.setReviewTime(rs.getTimestamp("review_time"));
            p.setReviewOpinion(rs.getString("review_opinion")); p.setDispenserId(rs.getObject("dispenser_id") != null ? rs.getInt("dispenser_id") : null);
            p.setDispenserName(rs.getString("dispenser_name")); p.setDispenseTime(rs.getTimestamp("dispense_time"));
            p.setIsEmergency(rs.getInt("is_emergency")); p.setIsChronic(rs.getInt("is_chronic"));
            p.setValidDays(rs.getInt("valid_days"));
            p.setCreateTime(rs.getTimestamp("create_time")); p.setUpdateTime(rs.getTimestamp("update_time"));
            return p;
        } catch (SQLException e) { return null; }
    }
}