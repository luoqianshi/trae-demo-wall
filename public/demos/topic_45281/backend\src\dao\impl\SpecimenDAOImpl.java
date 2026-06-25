package dao.impl;

import bean.Specimen;
import dao.SpecimenDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class SpecimenDAOImpl implements SpecimenDAO {

    @Override public int insert(Specimen s) {
        return JDBCUtil.executeInsert("INSERT INTO specimen(barcode,order_id,patient_id,patient_name,specimen_type,specimen_name,collection_method,collection_time,collector_name,body_part,container,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
            s.getBarcode(), s.getOrderId(), s.getPatientId(), s.getPatientName(), s.getSpecimenType(),
            s.getSpecimenName(), s.getCollectionMethod(), s.getCollectionTime(), s.getCollectorName(),
            s.getBodyPart(), s.getContainer(), "collected");
    }
    @Override public int update(Specimen s) {
        return JDBCUtil.executeUpdate("UPDATE specimen SET status=?,receive_time=NOW(),receiver_name=?,lab_dept=?,test_time=NOW(),tester_name=?,report_time=NOW() WHERE id=?",
            s.getStatus(), s.getReceiverName(), s.getLabDept(), s.getTesterName(), s.getId());
    }
    @Override public List<Specimen> findAll(Integer patientId, String status) {
        String sql = "SELECT * FROM specimen WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (patientId != null) { sql += " AND patient_id=?"; args.add(patientId); }
        if (status != null && !status.isEmpty()) { sql += " AND status=?"; args.add(status); }
        sql += " ORDER BY create_time DESC";
        return queryList(sql, args.toArray());
    }
    @Override public int delete(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM specimen WHERE id=?", id);
    }
    @Override public Specimen findById(int id) {
        List<Specimen> list = queryList("SELECT * FROM specimen WHERE id=?", id);
        return list.isEmpty() ? null : list.get(0);
    }

    private List<Specimen> queryList(String sql, Object... params) {
        List<Specimen> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private Specimen mapRow(ResultSet rs) throws SQLException {
        Specimen s = new Specimen();
        s.setId(rs.getInt("id")); s.setBarcode(rs.getString("barcode")); s.setOrderId(rs.getInt("order_id"));
        s.setPatientId(rs.getInt("patient_id")); s.setPatientName(rs.getString("patient_name"));
        s.setSpecimenType(rs.getString("specimen_type")); s.setSpecimenName(rs.getString("specimen_name"));
        s.setCollectionMethod(rs.getString("collection_method")); s.setCollectionTime(rs.getTimestamp("collection_time"));
        s.setCollectorName(rs.getString("collector_name")); s.setBodyPart(rs.getString("body_part"));
        s.setContainer(rs.getString("container")); s.setStatus(rs.getString("status"));
        s.setReceiveTime(rs.getTimestamp("receive_time")); s.setReceiverName(rs.getString("receiver_name"));
        s.setLabDept(rs.getString("lab_dept")); s.setTestTime(rs.getTimestamp("test_time"));
        s.setTesterName(rs.getString("tester_name")); s.setReportTime(rs.getTimestamp("report_time"));
        s.setCreateTime(rs.getTimestamp("create_time"));
        return s;
    }
}