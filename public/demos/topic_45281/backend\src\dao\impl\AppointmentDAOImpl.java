package dao.impl;

import bean.Appointment;
import dao.AppointmentDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AppointmentDAOImpl implements AppointmentDAO {

    @Override
    public int insert(Appointment a) {
        String sql = "INSERT INTO appointment(patient_id,patient_name,doctor_id,doctor_name,dept_id,dept_name,appointment_date,appointment_time_slot,appointment_no,source,status,reg_fee,cancel_reason) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)";
        String status = a.getStatus() != null ? a.getStatus() : "已预约";
        if ("已预约".equals(status)) status = "pending";
        if ("已取消".equals(status)) status = "cancelled";
        if ("已取号".equals(status)) status = "checked_in";
        if ("已就诊".equals(status)) status = "completed";
        return JDBCUtil.executeInsert(sql,
            a.getPatientId(), a.getPatientName(), a.getDoctorId(), a.getDoctorName(),
            a.getDeptId(), a.getDeptName(), a.getAppointmentDate(), a.getTimePeriod(),
            a.getAppointmentNo(), "online", status, a.getFee(), a.getCancelReason()
        );
    }

    @Override
    public int update(Appointment a) {
        String sql = "UPDATE appointment SET status=?,cancel_reason=? WHERE id=?";
        String status = a.getStatus();
        if ("已预约".equals(status)) status = "pending";
        if ("已取消".equals(status)) status = "cancelled";
        if ("已取号".equals(status)) status = "checked_in";
        if ("已就诊".equals(status)) status = "completed";
        return JDBCUtil.executeUpdate(sql, status, a.getCancelReason(), a.getId());
    }

    @Override
    public int delete(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM appointment WHERE id=?", id);
    }

    @Override
    public Appointment findById(int id) {
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM appointment WHERE id=?", id)) {
            if (qr != null && qr.getResultSet().next()) { return mapToAppointment(qr.getResultSet()); }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }

    @Override
    public List<Appointment> findByPatientId(int patientId) {
        List<Appointment> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM appointment WHERE patient_id=? ORDER BY appointment_date DESC", patientId)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapToAppointment(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override
    public List<Appointment> findByDoctorIdAndDate(int doctorId, String date) {
        List<Appointment> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM appointment WHERE doctor_id=? AND appointment_date=? ORDER BY appointment_time_slot", doctorId, date)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapToAppointment(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override
    public List<Appointment> findAll(String status, int page, int size) {
        List<Appointment> list = new ArrayList<>();
        String sql = "SELECT * FROM appointment WHERE 1=1";
        List<Object> params = new ArrayList<>();
        if (status != null && !status.isEmpty()) {
            String dbStatus = status;
            if ("已预约".equals(status)) dbStatus = "pending";
            if ("已取消".equals(status)) dbStatus = "cancelled";
            if ("已取号".equals(status)) dbStatus = "checked_in";
            if ("已就诊".equals(status)) dbStatus = "completed";
            sql += " AND status=?"; params.add(dbStatus);
        }
        sql += " ORDER BY appointment_date DESC LIMIT ? OFFSET ?";
        params.add(size); params.add((page - 1) * size);
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params.toArray())) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapToAppointment(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override
    public int countByStatus(String status) {
        String sql = "SELECT COUNT(*) as cnt FROM appointment";
        List<Object> params = new ArrayList<>();
        if (status != null && !status.isEmpty()) {
            String dbStatus = status;
            if ("已预约".equals(status)) dbStatus = "pending";
            if ("已取消".equals(status)) dbStatus = "cancelled";
            if ("已取号".equals(status)) dbStatus = "checked_in";
            if ("已就诊".equals(status)) dbStatus = "completed";
            sql += " WHERE status=?";
            params.add(dbStatus);
        }
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params.toArray())) {
            if (qr != null && qr.getResultSet().next()) { return qr.getResultSet().getInt("cnt"); }
        } catch (Exception e) { e.printStackTrace(); }
        return 0;
    }

    private Appointment mapToAppointment(ResultSet rs) throws SQLException {
        Appointment a = new Appointment();
        a.setId(rs.getInt("id"));
        a.setPatientId(rs.getInt("patient_id"));
        a.setPatientName(rs.getString("patient_name"));
        a.setDoctorId(rs.getInt("doctor_id"));
        a.setDoctorName(rs.getString("doctor_name"));
        a.setDeptId(rs.getInt("dept_id"));
        a.setDeptName(rs.getString("dept_name"));
        a.setAppointmentDate(rs.getDate("appointment_date"));
        try { a.setTimePeriod(rs.getString("appointment_time_slot")); } catch (Exception e) { }
        a.setAppointmentNo(rs.getString("appointment_no"));
        try { a.setAppointmentType(rs.getString("appointment_type")); } catch (Exception e) { }
        try { a.setRegistrationLevel(rs.getString("registration_level")); } catch (Exception e) { }
        String dbStatus = rs.getString("status");
        if ("pending".equals(dbStatus)) a.setStatus("已预约");
        else if ("checked_in".equals(dbStatus)) a.setStatus("已取号");
        else if ("completed".equals(dbStatus)) a.setStatus("已就诊");
        else if ("cancelled".equals(dbStatus)) a.setStatus("已取消");
        else a.setStatus(dbStatus);
        try { a.setFee(rs.getBigDecimal("reg_fee")); } catch (Exception e) { }
        try { a.setIsPaid(rs.getInt("is_paid")); } catch (Exception e) { }
        a.setCancelReason(rs.getString("cancel_reason"));
        try { a.setCreateTime(rs.getTimestamp("create_time")); } catch (Exception e) { }
        try { a.setUpdateTime(rs.getTimestamp("update_time")); } catch (Exception e) { }
        return a;
    }
}

