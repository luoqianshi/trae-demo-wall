package dao.impl;

import bean.FinanceGeneralLedger;
import dao.FinanceGeneralLedgerDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class FinanceGeneralLedgerDAOImpl implements FinanceGeneralLedgerDAO {

    @Override public int insert(FinanceGeneralLedger l) {
        return JDBCUtil.executeInsert("INSERT INTO finance_general_ledger(voucher_no,account_period,account_date,summary,subject_code,subject_name,subject_type,debit_amount,credit_amount,balance_amount,business_type,business_id,dept_id,dept_name,operator_id,operator_name,voucher_status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            l.getVoucherNo(), l.getAccountPeriod(), l.getAccountDate(), l.getSummary(), l.getSubjectCode(),
            l.getSubjectName(), l.getSubjectType(), l.getDebitAmount(), l.getCreditAmount(), l.getBalanceAmount(),
            l.getBusinessType(), l.getBusinessId(), l.getDeptId(), l.getDeptName(), l.getOperatorId(),
            l.getOperatorName(), "draft");
    }
    @Override public int update(FinanceGeneralLedger l) {
        return JDBCUtil.executeUpdate("UPDATE finance_general_ledger SET voucher_status=?,auditor_id=?,auditor_name=?,audit_time=NOW() WHERE id=?",
            l.getVoucherStatus(), l.getAuditorId(), l.getAuditorName(), l.getId());
    }
    @Override public int voidEntry(int id) {
        return JDBCUtil.executeUpdate("UPDATE finance_general_ledger SET voucher_status='void' WHERE id=?", id);
    }
    @Override public List<FinanceGeneralLedger> findAll(String period, String subject) {
        String sql = "SELECT * FROM finance_general_ledger WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (period != null && !period.isEmpty()) { sql += " AND account_period=?"; args.add(period); }
        if (subject != null && !subject.isEmpty()) { sql += " AND subject_code LIKE ?"; args.add(subject + "%"); }
        sql += " ORDER BY account_date DESC";
        return queryList(sql, args.toArray());
    }
    @Override public FinanceGeneralLedger findById(int id) {
        List<FinanceGeneralLedger> list = queryList("SELECT * FROM finance_general_ledger WHERE id=?", id);
        return list.isEmpty() ? null : list.get(0);
    }

    private List<FinanceGeneralLedger> queryList(String sql, Object... params) {
        List<FinanceGeneralLedger> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private FinanceGeneralLedger mapRow(ResultSet rs) throws SQLException {
        FinanceGeneralLedger l = new FinanceGeneralLedger();
        l.setId(rs.getInt("id")); l.setVoucherNo(rs.getString("voucher_no")); l.setAccountPeriod(rs.getString("account_period"));
        l.setAccountDate(rs.getDate("account_date")); l.setSummary(rs.getString("summary"));
        l.setSubjectCode(rs.getString("subject_code")); l.setSubjectName(rs.getString("subject_name"));
        l.setSubjectType(rs.getString("subject_type")); l.setDebitAmount(rs.getBigDecimal("debit_amount"));
        l.setCreditAmount(rs.getBigDecimal("credit_amount")); l.setBalanceAmount(rs.getBigDecimal("balance_amount"));
        l.setBusinessType(rs.getString("business_type")); l.setBusinessId(rs.getObject("business_id") != null ? rs.getInt("business_id") : null);
        l.setDeptId(rs.getObject("dept_id") != null ? rs.getInt("dept_id") : null); l.setDeptName(rs.getString("dept_name"));
        l.setOperatorId(rs.getInt("operator_id")); l.setOperatorName(rs.getString("operator_name"));
        l.setVoucherStatus(rs.getString("voucher_status")); l.setAuditTime(rs.getTimestamp("audit_time"));
        l.setAuditorId(rs.getObject("auditor_id") != null ? rs.getInt("auditor_id") : null);
        l.setAuditorName(rs.getString("auditor_name")); l.setCreateTime(rs.getTimestamp("create_time"));
        return l;
    }
}