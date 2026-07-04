package dao.impl;

import bean.ExaminationReport;
import dao.ExaminationReportDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class ExaminationReportDAOImpl implements ExaminationReportDAO {

    @Override public int insert(ExaminationReport r) {
        return JDBCUtil.executeInsert("INSERT INTO examination_report(report_no,order_id,patient_id,patient_name,examination_id,examination_name,examination_type,report_status,report_content,report_conclusion,report_diagnosis,imaging_data,image_count,reporter_id,reporter_name,is_abnormal,critical_value,critical_value_content) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            r.getReportNo(), r.getOrderId(), r.getPatientId(), r.getPatientName(), r.getExaminationId(),
            r.getExaminationName(), r.getExaminationType(), "draft", r.getReportContent(), r.getReportConclusion(),
            r.getReportDiagnosis(), r.getImagingData(), r.getImageCount(), r.getReporterId(), r.getReporterName(),
            r.getIsAbnormal(), r.getCriticalValue(), r.getCriticalValueContent());
    }
    @Override public int update(ExaminationReport r) {
        return JDBCUtil.executeUpdate("UPDATE examination_report SET report_status=?,report_content=?,report_conclusion=?,report_diagnosis=?,reporter_id=?,reporter_name=?,report_time=NOW(),verifier_id=?,verifier_name=?,verify_time=NOW() WHERE id=?",
            r.getReportStatus(), r.getReportContent(), r.getReportConclusion(), r.getReportDiagnosis(),
            r.getReporterId(), r.getReporterName(), r.getVerifierId(), r.getVerifierName(), r.getId());
    }
    @Override public List<ExaminationReport> findAll(Integer patientId, String type) {
        String sql = "SELECT * FROM examination_report WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (patientId != null) { sql += " AND patient_id=?"; args.add(patientId); }
        if (type != null && !type.isEmpty()) { sql += " AND examination_type=?"; args.add(type); }
        sql += " ORDER BY create_time DESC";
        return queryList(sql, args.toArray());
    }
    @Override public int voidReport(int id) {
        return JDBCUtil.executeUpdate("UPDATE examination_report SET report_status='void' WHERE id=?", id);
    }
    @Override public ExaminationReport findById(int id) {
        List<ExaminationReport> list = queryList("SELECT * FROM examination_report WHERE id=?", id);
        return list.isEmpty() ? null : list.get(0);
    }

    private List<ExaminationReport> queryList(String sql, Object... params) {
        List<ExaminationReport> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private ExaminationReport mapRow(ResultSet rs) throws SQLException {
        ExaminationReport r = new ExaminationReport();
        r.setId(rs.getInt("id")); r.setReportNo(rs.getString("report_no")); r.setOrderId(rs.getInt("order_id"));
        r.setPatientId(rs.getInt("patient_id")); r.setPatientName(rs.getString("patient_name"));
        r.setExaminationId(rs.getInt("examination_id")); r.setExaminationName(rs.getString("examination_name"));
        r.setExaminationType(rs.getString("examination_type")); r.setReportStatus(rs.getString("report_status"));
        r.setReportContent(rs.getString("report_content")); r.setReportConclusion(rs.getString("report_conclusion"));
        r.setReportDiagnosis(rs.getString("report_diagnosis")); r.setImagingData(rs.getString("imaging_data"));
        r.setImageCount(rs.getInt("image_count")); r.setReporterId(rs.getInt("reporter_id"));
        r.setReporterName(rs.getString("reporter_name")); r.setReportTime(rs.getTimestamp("report_time"));
        r.setVerifierId(rs.getObject("verifier_id") != null ? rs.getInt("verifier_id") : null);
        r.setVerifierName(rs.getString("verifier_name")); r.setVerifyTime(rs.getTimestamp("verify_time"));
        r.setIsAbnormal(rs.getInt("is_abnormal")); r.setCriticalValue(rs.getInt("critical_value"));
        r.setCriticalValueContent(rs.getString("critical_value_content"));
        r.setCreateTime(rs.getTimestamp("create_time"));
        return r;
    }
}