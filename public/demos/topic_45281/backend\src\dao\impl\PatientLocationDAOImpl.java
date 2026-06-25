package dao.impl;

import bean.PatientLocation;
import dao.PatientLocationDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class PatientLocationDAOImpl implements PatientLocationDAO {

    @Override public int insert(PatientLocation l) {
        return JDBCUtil.executeInsert("INSERT INTO patient_location(patient_id,patient_name,location_type,area_name,room_no,floor,building,status) VALUES(?,?,?,?,?,?,?,?)",
            l.getPatientId(), l.getPatientName(), l.getLocationType(), l.getAreaName(), l.getRoomNo(), l.getFloor(), l.getBuilding(),
            l.getStatus() != null ? l.getStatus() : "在位");
    }
    @Override public List<PatientLocation> findByLocPatientId(int patientId) {
        List<PatientLocation> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM patient_location WHERE patient_id=? ORDER BY check_in_time DESC LIMIT 20", patientId)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapLocation(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public int checkOut(int id) { return JDBCUtil.executeUpdate("UPDATE patient_location SET status='已离开',check_out_time=NOW() WHERE id=?", id); }

    private PatientLocation mapLocation(ResultSet rs) throws SQLException {
        PatientLocation l = new PatientLocation();
        l.setId(rs.getInt("id")); l.setPatientId(rs.getInt("patient_id")); l.setPatientName(rs.getString("patient_name"));
        l.setLocationType(rs.getString("location_type")); l.setAreaName(rs.getString("area_name"));
        l.setRoomNo(rs.getString("room_no")); l.setFloor(rs.getString("floor"));
        l.setBuilding(rs.getString("building")); l.setCheckInTime(rs.getTimestamp("check_in_time"));
        l.setCheckOutTime(rs.getTimestamp("check_out_time")); l.setStatus(rs.getString("status"));
        l.setRemark(rs.getString("remark")); l.setCreateTime(rs.getTimestamp("create_time"));
        return l;
    }
}