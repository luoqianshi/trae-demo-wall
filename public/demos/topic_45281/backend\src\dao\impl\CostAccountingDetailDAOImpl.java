package dao.impl;

import bean.CostAccountingDetail;
import dao.CostAccountingDetailDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class CostAccountingDetailDAOImpl implements CostAccountingDetailDAO {

    @Override public int insert(CostAccountingDetail d) {
        return JDBCUtil.executeInsert("INSERT INTO cost_accounting_detail(accounting_no,account_period,dept_id,dept_name,cost_type,cost_category,direct_cost,indirect_cost,total_cost,revenue_amount,profit_margin,cost_driver,status,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            d.getAccountingNo(), d.getAccountPeriod(), d.getDeptId(), d.getDeptName(), d.getCostType(),
            d.getCostCategory(), d.getDirectCost(), d.getIndirectCost(), d.getTotalCost(), d.getRevenueAmount(),
            d.getProfitMargin(), d.getCostDriver(), "draft", d.getRemark());
    }
    @Override public List<CostAccountingDetail> findAll(String period, Integer deptId) {
        String sql = "SELECT * FROM cost_accounting_detail WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (period != null && !period.isEmpty()) { sql += " AND account_period=?"; args.add(period); }
        if (deptId != null) { sql += " AND dept_id=?"; args.add(deptId); }
        sql += " ORDER BY dept_name, cost_type";
        return queryList(sql, args.toArray());
    }
    @Override public int voidDetail(int id) {
        return JDBCUtil.executeUpdate("UPDATE cost_accounting_detail SET status='void' WHERE id=?", id);
    }
    @Override public int delete(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM cost_accounting_detail WHERE id=?", id);
    }
    @Override public CostAccountingDetail findById(int id) {
        List<CostAccountingDetail> list = queryList("SELECT * FROM cost_accounting_detail WHERE id=?", id);
        return list.isEmpty() ? null : list.get(0);
    }

    private List<CostAccountingDetail> queryList(String sql, Object... params) {
        List<CostAccountingDetail> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private CostAccountingDetail mapRow(ResultSet rs) throws SQLException {
        CostAccountingDetail d = new CostAccountingDetail();
        d.setId(rs.getInt("id")); d.setAccountingNo(rs.getString("accounting_no")); d.setAccountPeriod(rs.getString("account_period"));
        d.setDeptId(rs.getInt("dept_id")); d.setDeptName(rs.getString("dept_name"));
        d.setCostType(rs.getString("cost_type")); d.setCostCategory(rs.getString("cost_category"));
        d.setDirectCost(rs.getBigDecimal("direct_cost")); d.setIndirectCost(rs.getBigDecimal("indirect_cost"));
        d.setTotalCost(rs.getBigDecimal("total_cost")); d.setRevenueAmount(rs.getBigDecimal("revenue_amount"));
        d.setProfitMargin(rs.getBigDecimal("profit_margin")); d.setCostDriver(rs.getString("cost_driver"));
        d.setStatus(rs.getString("status")); d.setRemark(rs.getString("remark"));
        d.setCreateTime(rs.getTimestamp("create_time")); d.setUpdateTime(rs.getTimestamp("update_time"));
        return d;
    }
}