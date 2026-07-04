package dao.impl;

import bean.FinanceBudget;
import dao.FinanceBudgetDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class FinanceBudgetDAOImpl implements FinanceBudgetDAO {

    @Override public int insert(FinanceBudget b) {
        return JDBCUtil.executeInsert("INSERT INTO finance_budget(budget_no,budget_year,budget_period,dept_id,dept_name,budget_type,budget_category,budget_amount,used_amount,remaining_amount,execution_rate,status,remark) VALUES(?,?,?,?,?,?,?,?,0,?,0,?,?)",
            b.getBudgetNo(), b.getBudgetYear(), b.getBudgetPeriod(), b.getDeptId(), b.getDeptName(),
            b.getBudgetType(), b.getBudgetCategory(), b.getBudgetAmount(), b.getBudgetAmount(), "draft", b.getRemark());
    }
    @Override public int update(FinanceBudget b) {
        return JDBCUtil.executeUpdate("UPDATE finance_budget SET status=?,used_amount=?,remaining_amount=budget_amount-used_amount,execution_rate=(used_amount/budget_amount)*100,approver_id=?,approver_name=?,approve_time=NOW() WHERE id=?",
            b.getStatus(), b.getUsedAmount(), b.getApproverId(), b.getApproverName(), b.getId());
    }
    @Override public int voidBudget(int id) {
        return JDBCUtil.executeUpdate("UPDATE finance_budget SET status='void' WHERE id=?", id);
    }
    @Override public List<FinanceBudget> findAll(String year, Integer deptId) {
        String sql = "SELECT * FROM finance_budget WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (year != null && !year.isEmpty()) { sql += " AND budget_year=?"; args.add(year); }
        if (deptId != null) { sql += " AND dept_id=?"; args.add(deptId); }
        sql += " ORDER BY budget_year DESC, dept_name";
        return queryList(sql, args.toArray());
    }
    @Override public FinanceBudget findById(int id) {
        List<FinanceBudget> list = queryList("SELECT * FROM finance_budget WHERE id=?", id);
        return list.isEmpty() ? null : list.get(0);
    }

    private List<FinanceBudget> queryList(String sql, Object... params) {
        List<FinanceBudget> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private FinanceBudget mapRow(ResultSet rs) throws SQLException {
        FinanceBudget b = new FinanceBudget();
        b.setId(rs.getInt("id")); b.setBudgetNo(rs.getString("budget_no")); b.setBudgetYear(rs.getString("budget_year"));
        b.setBudgetPeriod(rs.getString("budget_period")); b.setDeptId(rs.getInt("dept_id")); b.setDeptName(rs.getString("dept_name"));
        b.setBudgetType(rs.getString("budget_type")); b.setBudgetCategory(rs.getString("budget_category"));
        b.setBudgetAmount(rs.getBigDecimal("budget_amount")); b.setUsedAmount(rs.getBigDecimal("used_amount"));
        b.setRemainingAmount(rs.getBigDecimal("remaining_amount")); b.setExecutionRate(rs.getBigDecimal("execution_rate"));
        b.setStatus(rs.getString("status")); b.setApproverId(rs.getObject("approver_id") != null ? rs.getInt("approver_id") : null);
        b.setApproverName(rs.getString("approver_name")); b.setApproveTime(rs.getTimestamp("approve_time"));
        b.setRemark(rs.getString("remark")); b.setCreateTime(rs.getTimestamp("create_time")); b.setUpdateTime(rs.getTimestamp("update_time"));
        return b;
    }
}