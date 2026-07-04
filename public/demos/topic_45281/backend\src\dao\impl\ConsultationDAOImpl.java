package dao.impl;

import bean.Consultation;
import dao.ConsultationDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class ConsultationDAOImpl implements ConsultationDAO {

    @Override public int insert(Consultation c) {
        return JDBCUtil.executeInsert("INSERT INTO consultation(patient_id,patient_name,doctor_id,doctor_name,dept_name,subject,status) VALUES(?,?,?,?,?,?,?)",
            c.getPatientId(), c.getPatientName(), c.getDoctorId(), c.getDoctorName(), c.getDeptName(), c.getSubject(),
            c.getStatus() != null ? c.getStatus() : "待回复");
    }
    @Override public Consultation findConsultById(int id) {
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM consultation WHERE id=?", id)) {
            if (qr != null && qr.getResultSet().next()) { return mapConsultation(qr.getResultSet()); }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }
    @Override public List<Consultation> findByConsultDoctorId(int doctorId) {
        List<Consultation> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM consultation WHERE doctor_id=? ORDER BY last_message_time DESC", doctorId)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapConsultation(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public List<Consultation> findByConsultPatientId(int patientId) {
        List<Consultation> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM consultation WHERE patient_id=? ORDER BY last_message_time DESC", patientId)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapConsultation(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public int updateStatus(int id, String status) {
        if ("已关闭".equals(status)) return JDBCUtil.executeUpdate("UPDATE consultation SET status='已关闭',close_time=NOW() WHERE id=?", id);
        return JDBCUtil.executeUpdate("UPDATE consultation SET status=? WHERE id=?", status, id);
    }

    private Consultation mapConsultation(ResultSet rs) throws SQLException {
        Consultation c = new Consultation();
        c.setId(rs.getInt("id")); c.setPatientId(rs.getInt("patient_id")); c.setPatientName(rs.getString("patient_name"));
        c.setDoctorId(rs.getInt("doctor_id")); c.setDoctorName(rs.getString("doctor_name"));
        c.setDeptName(rs.getString("dept_name")); c.setSubject(rs.getString("subject"));
        c.setStatus(rs.getString("status")); c.setLastMessageTime(rs.getTimestamp("last_message_time"));
        c.setCloseTime(rs.getTimestamp("close_time")); c.setCreateTime(rs.getTimestamp("create_time"));
        return c;
    }
}