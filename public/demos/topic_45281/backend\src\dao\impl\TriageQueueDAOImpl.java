package dao.impl;

import bean.TriageQueue;
import dao.TriageQueueDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class TriageQueueDAOImpl implements TriageQueueDAO {

    @Override public int insert(TriageQueue q) {
        return JDBCUtil.executeInsert("INSERT INTO triage_queue(registration_id,patient_id,patient_name,patient_gender,patient_age,dept_id,dept_name,doctor_id,doctor_name,queue_no,queue_type,priority,source,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            q.getRegistrationId(), q.getPatientId(), q.getPatientName(), q.getPatientGender(), q.getPatientAge(),
            q.getDeptId(), q.getDeptName(), q.getDoctorId(), q.getDoctorName(), q.getQueueNo(), q.getQueueType(),
            q.getPriority(), q.getSource(), q.getStatus());
    }
    @Override public int update(TriageQueue q) {
        return JDBCUtil.executeUpdate("UPDATE triage_queue SET status=?,call_count=?,last_call_time=NOW(),waiting_duration=TIMESTAMPDIFF(MINUTE,create_time,NOW()) WHERE id=?",
            q.getStatus(), q.getCallCount(), q.getId());
    }
    @Override public List<TriageQueue> findAll(Integer deptId, Integer doctorId, String status) {
        String sql = "SELECT * FROM triage_queue WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (deptId != null) { sql += " AND dept_id=?"; args.add(deptId); }
        if (doctorId != null) { sql += " AND doctor_id=?"; args.add(doctorId); }
        if (status != null && !status.isEmpty()) { sql += " AND status=?"; args.add(status); }
        sql += " ORDER BY priority DESC, queue_no ASC";
        return queryList(sql, args.toArray());
    }
    @Override public int delete(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM triage_queue WHERE id=?", id);
    }

    private List<TriageQueue> queryList(String sql, Object... params) {
        List<TriageQueue> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private TriageQueue mapRow(ResultSet rs) throws SQLException {
        TriageQueue q = new TriageQueue();
        q.setId(rs.getInt("id")); q.setRegistrationId(rs.getInt("registration_id")); q.setPatientId(rs.getInt("patient_id"));
        q.setPatientName(rs.getString("patient_name")); q.setPatientGender(rs.getString("patient_gender"));
        q.setPatientAge(rs.getInt("patient_age")); q.setDeptId(rs.getInt("dept_id")); q.setDeptName(rs.getString("dept_name"));
        q.setDoctorId(rs.getInt("doctor_id")); q.setDoctorName(rs.getString("doctor_name"));
        q.setQueueNo(rs.getString("queue_no")); q.setQueueType(rs.getString("queue_type"));
        q.setPriority(rs.getInt("priority")); q.setSource(rs.getString("source")); q.setStatus(rs.getString("status"));
        q.setCallCount(rs.getInt("call_count")); q.setFirstCallTime(rs.getTimestamp("first_call_time"));
        q.setLastCallTime(rs.getTimestamp("last_call_time")); q.setConsultationStartTime(rs.getTimestamp("consultation_start_time"));
        q.setConsultationEndTime(rs.getTimestamp("consultation_end_time")); q.setWaitingDuration(rs.getInt("waiting_duration"));
        q.setCreateTime(rs.getTimestamp("create_time")); q.setUpdateTime(rs.getTimestamp("update_time"));
        return q;
    }
}