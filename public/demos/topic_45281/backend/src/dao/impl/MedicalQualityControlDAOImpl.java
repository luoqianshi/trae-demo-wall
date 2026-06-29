package dao.impl;

import bean.MedicalQualityControl;
import dao.MedicalQualityControlDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class MedicalQualityControlDAOImpl implements MedicalQualityControlDAO {

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

    @Override public int insert(MedicalQualityControl q) {
        return JDBCUtil.executeInsert("INSERT INTO medical_quality_control(qc_type,target_type,target_id,target_no,patient_id,patient_name,doctor_id,doctor_name,dept_id,dept_name,qc_item,qc_standard,actual_value,standard_value,result,score,full_score,problem_description,suggestion,qc_person_id,qc_person_name,qc_time,rectify_deadline,rectify_status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            q.getQcType(), q.getTargetType(), q.getTargetId(), q.getTargetNo(), q.getPatientId(),
            q.getPatientName(), q.getDoctorId(), q.getDoctorName(), q.getDeptId(), q.getDeptName(),
            q.getQcItem(), q.getQcStandard(), q.getActualValue(), q.getStandardValue(),
            q.getResult(), q.getScore(), q.getFullScore(), q.getProblemDescription(),
            q.getSuggestion(), q.getQcPersonId(), q.getQcPersonName(), q.getQcTime(),
            q.getRectifyDeadline(), q.getRectifyStatus() != null ? q.getRectifyStatus() : "待整改");
    }
    @Override public int updateQC(MedicalQualityControl q) {
        return JDBCUtil.executeUpdate("UPDATE medical_quality_control SET result=?,score=?,problem_description=?,suggestion=?,rectify_status=?,rectify_result=?,verify_person_id=?,verify_person_name=?,verify_time=? WHERE id=?",
            q.getResult(), q.getScore(), q.getProblemDescription(), q.getSuggestion(),
            q.getRectifyStatus(), q.getRectifyResult(), q.getVerifyPersonId(), q.getVerifyPersonName(),
            q.getVerifyTime(), q.getId());
    }
    @Override public MedicalQualityControl findQCById(int id) {
        List<MedicalQualityControl> list = queryList("SELECT * FROM medical_quality_control WHERE id=?", this::mapMQC, id);
        return list.isEmpty() ? null : list.get(0);
    }
    @Override public List<MedicalQualityControl> findAllQCRecords(String targetType, String result, int page, int size) {
        String sql = "SELECT * FROM medical_quality_control WHERE 1=1";
        List<Object> params = new ArrayList<>();
        if (targetType != null && !targetType.isEmpty()) { sql += " AND target_type=?"; params.add(targetType); }
        if (result != null && !result.isEmpty()) { sql += " AND result=?"; params.add(result); }
        sql += " ORDER BY qc_time DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page-1)*size);
        return queryList(sql, this::mapMQC, params.toArray());
    }

    private MedicalQualityControl mapMQC(ResultSet rs) {
        try {
            MedicalQualityControl q = new MedicalQualityControl();
            q.setId(rs.getInt("id")); q.setQcType(rs.getString("qc_type")); q.setTargetType(rs.getString("target_type"));
            q.setTargetId(rs.getInt("target_id")); q.setTargetNo(rs.getString("target_no"));
            q.setPatientId(rs.getObject("patient_id") != null ? rs.getInt("patient_id") : null);
            q.setPatientName(rs.getString("patient_name")); q.setDoctorId(rs.getObject("doctor_id") != null ? rs.getInt("doctor_id") : null);
            q.setDoctorName(rs.getString("doctor_name")); q.setDeptId(rs.getObject("dept_id") != null ? rs.getInt("dept_id") : null);
            q.setDeptName(rs.getString("dept_name")); q.setQcItem(rs.getString("qc_item"));
            q.setQcStandard(rs.getString("qc_standard")); q.setActualValue(rs.getString("actual_value"));
            q.setStandardValue(rs.getString("standard_value")); q.setResult(rs.getString("result"));
            q.setScore(rs.getObject("score") != null ? rs.getInt("score") : null); q.setFullScore(rs.getInt("full_score"));
            q.setProblemDescription(rs.getString("problem_description")); q.setSuggestion(rs.getString("suggestion"));
            q.setQcPersonId(rs.getInt("qc_person_id")); q.setQcPersonName(rs.getString("qc_person_name"));
            q.setQcTime(rs.getTimestamp("qc_time")); q.setRectifyDeadline(rs.getDate("rectify_deadline"));
            q.setRectifyStatus(rs.getString("rectify_status")); q.setRectifyResult(rs.getString("rectify_result"));
            q.setVerifyPersonId(rs.getObject("verify_person_id") != null ? rs.getInt("verify_person_id") : null);
            q.setVerifyPersonName(rs.getString("verify_person_name")); q.setVerifyTime(rs.getTimestamp("verify_time"));
            q.setCreateTime(rs.getTimestamp("create_time")); q.setUpdateTime(rs.getTimestamp("update_time"));
            return q;
        } catch (SQLException e) { return null; }
    }
}