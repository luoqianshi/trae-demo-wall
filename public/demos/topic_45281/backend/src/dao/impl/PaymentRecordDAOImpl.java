package dao.impl;

import bean.PaymentRecord;
import dao.PaymentRecordDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class PaymentRecordDAOImpl implements PaymentRecordDAO {

    private List<PaymentRecord> queryPayments(String sql, Object... params) {
        List<PaymentRecord> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapPaymentRecord(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }

    @Override public int insert(PaymentRecord r) {
        return JDBCUtil.executeInsert("INSERT INTO payment_record(order_no,patient_id,patient_name,business_type,business_id,amount,paid_amount,discount_amount,insurance_amount,self_pay_amount,payment_method,payment_status,payer_name,cashier_id,cashier_name,transaction_no) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            r.getOrderNo(), r.getPatientId(), r.getPatientName(), r.getBusinessType(), r.getBusinessId(),
            r.getAmount(), r.getPaidAmount(), r.getDiscountAmount(), r.getInsuranceAmount(), r.getSelfPayAmount(),
            r.getPaymentMethod(), r.getPaymentStatus() != null ? r.getPaymentStatus() : "待支付",
            r.getPayerName(), r.getCashierId(), r.getCashierName(), r.getTransactionNo());
    }
    @Override public PaymentRecord findByOrderNo(String orderNo) {
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery("SELECT * FROM payment_record WHERE order_no=?", orderNo)) {
            if (qr != null && qr.getResultSet().next()) { return mapPaymentRecord(qr.getResultSet()); }
        } catch (Exception e) { e.printStackTrace(); }
        return null;
    }
    @Override public List<PaymentRecord> findPaymentsByPatientId(int patientId) { return queryPayments("SELECT * FROM payment_record WHERE patient_id=? ORDER BY create_time DESC", patientId); }
    @Override public List<PaymentRecord> findAllPayments(int page, int size) { return queryPayments("SELECT * FROM payment_record ORDER BY create_time DESC LIMIT ? OFFSET ?", size, (page-1)*size); }
    @Override public int updateStatus(String orderNo, String status) {
        return JDBCUtil.executeUpdate("UPDATE payment_record SET payment_status=?,pay_time=NOW() WHERE order_no=?", status, orderNo);
    }

    private PaymentRecord mapPaymentRecord(ResultSet rs) throws SQLException {
        PaymentRecord r = new PaymentRecord();
        r.setId(rs.getInt("id")); r.setOrderNo(rs.getString("order_no")); r.setPatientId(rs.getInt("patient_id"));
        r.setPatientName(rs.getString("patient_name")); r.setBusinessType(rs.getString("business_type"));
        r.setBusinessId(rs.getInt("business_id")); r.setAmount(rs.getBigDecimal("amount"));
        r.setPaidAmount(rs.getBigDecimal("paid_amount")); r.setDiscountAmount(rs.getBigDecimal("discount_amount"));
        r.setInsuranceAmount(rs.getBigDecimal("insurance_amount")); r.setSelfPayAmount(rs.getBigDecimal("self_pay_amount"));
        r.setPaymentMethod(rs.getString("payment_method")); r.setPaymentStatus(rs.getString("payment_status"));
        r.setPayerName(rs.getString("payer_name")); r.setCashierId(rs.getInt("cashier_id"));
        r.setCashierName(rs.getString("cashier_name")); r.setTransactionNo(rs.getString("transaction_no"));
        r.setRefundOrderNo(rs.getString("refund_order_no")); r.setRefundReason(rs.getString("refund_reason"));
        r.setPayTime(rs.getTimestamp("pay_time")); r.setCreateTime(rs.getTimestamp("create_time"));
        r.setUpdateTime(rs.getTimestamp("update_time"));
        return r;
    }
}