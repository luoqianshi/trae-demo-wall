package dao.impl;

import bean.Payroll;
import dao.PayrollDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class PayrollDAOImpl implements PayrollDAO {

    @Override public int insert(Payroll p) {
        return JDBCUtil.executeInsert("INSERT INTO payroll(payroll_no,staff_id,staff_no,staff_name,dept_id,dept_name,pay_period,base_salary,performance_salary,position_salary,overtime_pay,bonus,subsidy,gross_pay,pension_insurance,medical_insurance,unemployment_insurance,housing_fund,income_tax,other_deductions,total_deductions,net_pay,pay_status,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            p.getPayrollNo(), p.getStaffId(), p.getStaffNo(), p.getStaffName(), p.getDeptId(), p.getDeptName(),
            p.getPayPeriod(), p.getBaseSalary(), p.getPerformanceSalary(), p.getPositionSalary(),
            p.getOvertimePay(), p.getBonus(), p.getSubsidy(), p.getGrossPay(), p.getPensionInsurance(),
            p.getMedicalInsurance(), p.getUnemploymentInsurance(), p.getHousingFund(), p.getIncomeTax(),
            p.getOtherDeductions(), p.getTotalDeductions(), p.getNetPay(), "pending", p.getRemark());
    }
    @Override public int update(Payroll p) {
        return JDBCUtil.executeUpdate("UPDATE payroll SET pay_status=?,pay_date=?,pay_method=?,operator_id=?,operator_name=? WHERE id=?",
            p.getPayStatus(), p.getPayDate(), p.getPayMethod(), p.getOperatorId(), p.getOperatorName(), p.getId());
    }
    @Override public int voidPayroll(int id) {
        return JDBCUtil.executeUpdate("UPDATE payroll SET pay_status='void' WHERE id=?", id);
    }
    @Override public List<Payroll> findAll(String period, Integer deptId) {
        String sql = "SELECT * FROM payroll WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (period != null && !period.isEmpty()) { sql += " AND pay_period=?"; args.add(period); }
        if (deptId != null) { sql += " AND dept_id=?"; args.add(deptId); }
        sql += " ORDER BY dept_name, staff_name";
        return queryList(sql, args.toArray());
    }
    @Override public Payroll findById(int id) {
        List<Payroll> list = queryList("SELECT * FROM payroll WHERE id=?", id);
        return list.isEmpty() ? null : list.get(0);
    }

    private List<Payroll> queryList(String sql, Object... params) {
        List<Payroll> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private Payroll mapRow(ResultSet rs) throws SQLException {
        Payroll p = new Payroll();
        p.setId(rs.getInt("id")); p.setPayrollNo(rs.getString("payroll_no")); p.setStaffId(rs.getInt("staff_id"));
        p.setStaffNo(rs.getString("staff_no")); p.setStaffName(rs.getString("staff_name"));
        p.setDeptId(rs.getInt("dept_id")); p.setDeptName(rs.getString("dept_name")); p.setPayPeriod(rs.getString("pay_period"));
        p.setBaseSalary(rs.getBigDecimal("base_salary")); p.setPerformanceSalary(rs.getBigDecimal("performance_salary"));
        p.setPositionSalary(rs.getBigDecimal("position_salary")); p.setOvertimePay(rs.getBigDecimal("overtime_pay"));
        p.setBonus(rs.getBigDecimal("bonus")); p.setSubsidy(rs.getBigDecimal("subsidy"));
        p.setGrossPay(rs.getBigDecimal("gross_pay")); p.setPensionInsurance(rs.getBigDecimal("pension_insurance"));
        p.setMedicalInsurance(rs.getBigDecimal("medical_insurance")); p.setUnemploymentInsurance(rs.getBigDecimal("unemployment_insurance"));
        p.setHousingFund(rs.getBigDecimal("housing_fund")); p.setIncomeTax(rs.getBigDecimal("income_tax"));
        p.setOtherDeductions(rs.getBigDecimal("other_deductions")); p.setTotalDeductions(rs.getBigDecimal("total_deductions"));
        p.setNetPay(rs.getBigDecimal("net_pay")); p.setPayStatus(rs.getString("pay_status"));
        p.setPayDate(rs.getDate("pay_date")); p.setPayMethod(rs.getString("pay_method"));
        p.setOperatorId(rs.getObject("operator_id") != null ? rs.getInt("operator_id") : null);
        p.setOperatorName(rs.getString("operator_name")); p.setRemark(rs.getString("remark"));
        p.setCreateTime(rs.getTimestamp("create_time"));
        return p;
    }
}