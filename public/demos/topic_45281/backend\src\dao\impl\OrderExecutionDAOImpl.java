package dao.impl;

import bean.OrderExecution;
import dao.OrderExecutionDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class OrderExecutionDAOImpl implements OrderExecutionDAO {

    @Override public int insert(OrderExecution e) {
        return JDBCUtil.executeInsert("INSERT INTO order_execution(execution_no,order_id,order_type,patient_id,patient_name,dept_id,dept_name,doctor_id,doctor_name,execution_type,execution_status,executor_id,executor_name,execution_result,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            e.getExecutionNo(), e.getOrderId(), e.getOrderType(), e.getPatientId(), e.getPatientName(),
            e.getDeptId(), e.getDeptName(), e.getDoctorId(), e.getDoctorName(), e.getExecutionType(),
            "pending", e.getExecutorId(), e.getExecutorName(), e.getExecutionResult(), e.getRemark());
    }
    @Override public int update(OrderExecution e) {
        return JDBCUtil.executeUpdate("UPDATE order_execution SET execution_status=?,executor_id=?,executor_name=?,execution_time=NOW(),execution_result=? WHERE id=?",
            e.getExecutionStatus(), e.getExecutorId(), e.getExecutorName(), e.getExecutionResult(), e.getId());
    }
    @Override public List<OrderExecution> findAll(Integer patientId, String status) {
        String sql = "SELECT * FROM order_execution WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (patientId != null) { sql += " AND patient_id=?"; args.add(patientId); }
        if (status != null && !status.isEmpty()) { sql += " AND execution_status=?"; args.add(status); }
        sql += " ORDER BY create_time DESC";
        return queryList(sql, args.toArray());
    }
    @Override public int delete(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM order_execution WHERE id=?", id);
    }
    @Override public OrderExecution findById(int id) {
        List<OrderExecution> list = queryList("SELECT * FROM order_execution WHERE id=?", id);
        return list.isEmpty() ? null : list.get(0);
    }

    private List<OrderExecution> queryList(String sql, Object... params) {
        List<OrderExecution> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private OrderExecution mapRow(ResultSet rs) throws SQLException {
        OrderExecution e = new OrderExecution();
        e.setId(rs.getInt("id")); e.setExecutionNo(rs.getString("execution_no")); e.setOrderId(rs.getInt("order_id"));
        e.setOrderType(rs.getString("order_type")); e.setPatientId(rs.getInt("patient_id")); e.setPatientName(rs.getString("patient_name"));
        e.setDeptId(rs.getInt("dept_id")); e.setDeptName(rs.getString("dept_name"));
        e.setDoctorId(rs.getInt("doctor_id")); e.setDoctorName(rs.getString("doctor_name"));
        e.setExecutionType(rs.getString("execution_type")); e.setExecutionStatus(rs.getString("execution_status"));
        e.setExecutorId(rs.getInt("executor_id")); e.setExecutorName(rs.getString("executor_name"));
        e.setExecutionTime(rs.getTimestamp("execution_time")); e.setExecutionResult(rs.getString("execution_result"));
        e.setRemark(rs.getString("remark")); e.setCreateTime(rs.getTimestamp("create_time"));
        return e;
    }
}