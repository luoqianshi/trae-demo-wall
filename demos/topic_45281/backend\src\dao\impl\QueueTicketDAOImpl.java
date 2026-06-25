package dao.impl;

import bean.QueueTicket;
import dao.QueueTicketDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class QueueTicketDAOImpl implements QueueTicketDAO {

    private List<QueueTicket> queryTickets(String sql, Object... params) {
        List<QueueTicket> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapQueueTicket(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override public int insert(QueueTicket t) {
        return JDBCUtil.executeInsert("INSERT INTO queue_ticket(business_type,patient_id,patient_name,ticket_no,dept_id,dept_name,window_no,status,priority) VALUES(?,?,?,?,?,?,?,?,?)",
            t.getBusinessType(), t.getPatientId(), t.getPatientName(), t.getTicketNo(), t.getDeptId(), t.getDeptName(), t.getWindowNo(),
            t.getStatus() != null ? t.getStatus() : "等待中", t.getPriority());
    }
    @Override public int update(QueueTicket t) {
        return JDBCUtil.executeUpdate("UPDATE queue_ticket SET status=?,window_no=?,called_count=?,start_time=?,finish_time=? WHERE id=?",
            t.getStatus(), t.getWindowNo(), t.getCalledCount(), t.getStartTime(), t.getFinishTime(), t.getId());
    }
    @Override public List<QueueTicket> findByTypeAndStatus(String type, String status) {
        String sql = "SELECT * FROM queue_ticket WHERE business_type=?";
        List<Object> params = new ArrayList<>();
        params.add(type);
        if (status != null && !status.isEmpty()) { sql += " AND status=?"; params.add(status); }
        sql += " ORDER BY priority DESC, create_time ASC";
        return queryTickets(sql, params.toArray());
    }
    @Override public QueueTicket findCurrentCalling(String type, int deptId) {
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(
            "SELECT * FROM queue_ticket WHERE business_type=? AND dept_id=? AND status IN('叫号中','办理中') ORDER BY create_time ASC LIMIT 1", type, deptId)) {
            if (qr != null && qr.getResultSet().next()) { return mapQueueTicket(qr.getResultSet()); }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }

    private QueueTicket mapQueueTicket(ResultSet rs) throws SQLException {
        QueueTicket t = new QueueTicket();
        t.setId(rs.getInt("id")); t.setBusinessType(rs.getString("business_type")); t.setPatientId(rs.getInt("patient_id"));
        t.setPatientName(rs.getString("patient_name")); t.setTicketNo(rs.getString("ticket_no"));
        t.setDeptId(rs.getInt("dept_id")); t.setDeptName(rs.getString("dept_name"));
        t.setWindowNo(rs.getString("window_no")); t.setStatus(rs.getString("status"));
        t.setPriority(rs.getInt("priority")); t.setCalledCount(rs.getInt("called_count"));
        t.setCallTime(rs.getTimestamp("call_time")); t.setStartTime(rs.getTimestamp("start_time"));
        t.setFinishTime(rs.getTimestamp("finish_time")); t.setWaitMinutes(rs.getObject("wait_minutes") != null ? rs.getInt("wait_minutes") : null);
        t.setCreateTime(rs.getTimestamp("create_time"));
        return t;
    }
}