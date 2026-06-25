package dao.impl;

import bean.TreatmentExecution;
import dao.TreatmentExecutionDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class TreatmentExecutionDAOImpl implements TreatmentExecutionDAO {

    @Override public int insert(TreatmentExecution e) {
        return JDBCUtil.executeInsert("INSERT INTO treatment_execution(execution_no,order_id,patient_id,patient_name,treatment_name,treatment_type,dept_id,dept_name,treatment_location,scheduled_date,scheduled_time_slot,executor_id,executor_name,execution_status,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            e.getExecutionNo(), e.getOrderId(), e.getPatientId(), e.getPatientName(), e.getTreatmentName(),
            e.getTreatmentType(), e.getDeptId(), e.getDeptName(), e.getTreatmentLocation(), e.getScheduledDate(),
            e.getScheduledTimeSlot(), e.getExecutorId(), e.getExecutorName(), "pending", e.getRemark());
    }
    @Override public int update(TreatmentExecution e) {
        return JDBCUtil.executeUpdate("UPDATE treatment_execution SET execution_status=?,executor_id=?,executor_name=?,execution_time=NOW(),execution_result=?,remark=? WHERE id=?",
            e.getExecutionStatus(), e.getExecutorId(), e.getExecutorName(), e.getExecutionResult(), e.getRemark(), e.getId());
    }
    @Override public List<TreatmentExecution> findAll(Integer patientId, String status) {
        String sql = "SELECT * FROM treatment_execution WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (patientId != null) { sql += " AND patient_id=?"; args.add(patientId); }
        if (status != null && !status.isEmpty()) { sql += " AND execution_status=?"; args.add(status); }
        sql += " ORDER BY scheduled_date DESC";
        return queryList(sql, args.toArray());
    }
    @Override public int delete(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM treatment_execution WHERE id=?", id);
    }
    @Override public TreatmentExecution findById(int id) {
        List<TreatmentExecution> list = queryList("SELECT * FROM treatment_execution WHERE id=?", id);
        return list.isEmpty() ? null : list.get(0);
    }

    private List<TreatmentExecution> queryList(String sql, Object... params) {
        List<TreatmentExecution> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private TreatmentExecution mapRow(ResultSet rs) throws SQLException {
        TreatmentExecution e = new TreatmentExecution();
        e.setId(rs.getInt("id")); e.setExecutionNo(rs.getString("execution_no")); e.setOrderId(rs.getInt("order_id"));
        e.setPatientId(rs.getInt("patient_id")); e.setPatientName(rs.getString("patient_name"));
        e.setTreatmentName(rs.getString("treatment_name")); e.setTreatmentType(rs.getString("treatment_type"));
        e.setDeptId(rs.getInt("dept_id")); e.setDeptName(rs.getString("dept_name"));
        e.setTreatmentLocation(rs.getString("treatment_location")); e.setScheduledDate(rs.getDate("scheduled_date"));
        e.setScheduledTimeSlot(rs.getString("scheduled_time_slot")); e.setExecutorId(rs.getInt("executor_id"));
        e.setExecutorName(rs.getString("executor_name")); e.setExecutionStatus(rs.getString("execution_status"));
        e.setExecutionResult(rs.getString("execution_result"));
        e.setRemark(rs.getString("remark")); e.setCreateTime(rs.getTimestamp("create_time"));
        return e;
    }
}