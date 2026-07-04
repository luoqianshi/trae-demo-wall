package dao.impl;

import bean.CompanionService;
import dao.CompanionServiceDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class CompanionServiceDAOImpl implements CompanionServiceDAO {

    @Override public int insert(CompanionService c) {
        return JDBCUtil.executeInsert("INSERT INTO companion_service(inpatient_id,patient_id,patient_name,companion_name,companion_phone,companion_id_card,relation,start_date,end_date,status,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
            c.getInpatientId(), c.getPatientId(), c.getPatientName(), c.getCompanionName(), c.getCompanionPhone(),
            c.getCompanionIdCard(), c.getRelation(), c.getStartDate(), c.getEndDate(),
            c.getStatus() != null ? c.getStatus() : "进行中", c.getRemark());
    }
    @Override public List<CompanionService> findByCompanionPatientId(int patientId) {
        List<CompanionService> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM companion_service WHERE patient_id=? ORDER BY start_date DESC", patientId)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapCompanion(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public List<CompanionService> findByInpatientId(int inpatientId) {
        List<CompanionService> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM companion_service WHERE inpatient_id=? AND status='进行中'", inpatientId)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapCompanion(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    @Override public int endService(int id) { return JDBCUtil.executeUpdate("UPDATE companion_service SET status='已结束',end_date=CURDATE() WHERE id=?", id); }

    private CompanionService mapCompanion(ResultSet rs) throws SQLException {
        CompanionService c = new CompanionService();
        c.setId(rs.getInt("id")); c.setInpatientId(rs.getObject("inpatient_id") != null ? rs.getInt("inpatient_id") : null);
        c.setPatientId(rs.getInt("patient_id")); c.setPatientName(rs.getString("patient_name"));
        c.setCompanionName(rs.getString("companion_name")); c.setCompanionPhone(rs.getString("companion_phone"));
        c.setCompanionIdCard(rs.getString("companion_id_card")); c.setRelation(rs.getString("relation"));
        c.setStartDate(rs.getDate("start_date")); c.setEndDate(rs.getDate("end_date"));
        c.setStatus(rs.getString("status")); c.setRemark(rs.getString("remark"));
        c.setCreateTime(rs.getTimestamp("create_time"));
        return c;
    }
}