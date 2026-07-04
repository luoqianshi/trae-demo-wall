package dao.impl;

import bean.QueueDisplay;
import dao.QueueDisplayDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class QueueDisplayDAOImpl implements QueueDisplayDAO {

    @Override public int insertOrReplace(QueueDisplay q) {
        return JDBCUtil.executeInsert("REPLACE INTO queue_display(dept_id,dept_name,doctor_id,doctor_name,doctor_room,current_queue_no,current_patient_name,waiting_list,display_status) VALUES(?,?,?,?,?,?,?,?,?)",
            q.getDeptId(), q.getDeptName(), q.getDoctorId(), q.getDoctorName(), q.getDoctorRoom(),
            q.getCurrentQueueNo(), q.getCurrentPatientName(), q.getWaitingList(), "active");
    }
    @Override public List<QueueDisplay> findByDept(Integer deptId) {
        String sql = "SELECT * FROM queue_display WHERE display_status='active'";
        List<Object> args = new ArrayList<>();
        if (deptId != null) { sql += " AND dept_id=?"; args.add(deptId); }
        return queryList(sql, args.toArray());
    }
    @Override public int delete(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM queue_display WHERE id=?", id);
    }

    private List<QueueDisplay> queryList(String sql, Object... params) {
        List<QueueDisplay> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private QueueDisplay mapRow(ResultSet rs) throws SQLException {
        QueueDisplay q = new QueueDisplay();
        q.setId(rs.getInt("id")); q.setDeptId(rs.getInt("dept_id")); q.setDeptName(rs.getString("dept_name"));
        q.setDoctorId(rs.getInt("doctor_id")); q.setDoctorName(rs.getString("doctor_name"));
        q.setDoctorRoom(rs.getString("doctor_room")); q.setCurrentQueueNo(rs.getString("current_queue_no"));
        q.setCurrentPatientName(rs.getString("current_patient_name")); q.setWaitingList(rs.getString("waiting_list"));
        q.setDisplayStatus(rs.getString("display_status")); q.setUpdateTime(rs.getTimestamp("update_time"));
        return q;
    }
}