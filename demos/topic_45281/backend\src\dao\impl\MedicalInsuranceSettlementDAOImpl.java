package dao.impl;

import bean.MedicalInsuranceSettlement;
import dao.MedicalInsuranceSettlementDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class MedicalInsuranceSettlementDAOImpl implements MedicalInsuranceSettlementDAO {

    @Override public int insert(MedicalInsuranceSettlement s) {
        return JDBCUtil.executeInsert("INSERT INTO medical_insurance_settlement(settlement_no,charge_id,patient_id,patient_name,insurance_type,insurance_no,total_fee,insurance_paid,fund_paid,personal_account_paid,personal_cash_paid,deductible_amount,reimbursement_ratio,self_paid_ratio,self_paid_amount,operator_id,operator_name,status) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            s.getSettlementNo(), s.getChargeId(), s.getPatientId(), s.getPatientName(), s.getInsuranceType(),
            s.getInsuranceNo(), s.getTotalFee(), s.getInsurancePaid(), s.getFundPaid(), s.getPersonalAccountPaid(),
            s.getPersonalCashPaid(), s.getDeductibleAmount(), s.getReimbursementRatio(), s.getSelfPaidRatio(),
            s.getSelfPaidAmount(), s.getOperatorId(), s.getOperatorName(), "settled");
    }
    @Override public List<MedicalInsuranceSettlement> findByPatient(int patientId) {
        return queryList("SELECT * FROM medical_insurance_settlement WHERE patient_id=? ORDER BY settlement_time DESC", patientId);
    }
    @Override public int delete(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM medical_insurance_settlement WHERE id=?", id);
    }

    private List<MedicalInsuranceSettlement> queryList(String sql, Object... params) {
        List<MedicalInsuranceSettlement> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private MedicalInsuranceSettlement mapRow(ResultSet rs) throws SQLException {
        MedicalInsuranceSettlement s = new MedicalInsuranceSettlement();
        s.setId(rs.getInt("id")); s.setSettlementNo(rs.getString("settlement_no")); s.setChargeId(rs.getInt("charge_id"));
        s.setPatientId(rs.getInt("patient_id")); s.setPatientName(rs.getString("patient_name"));
        s.setInsuranceType(rs.getString("insurance_type")); s.setInsuranceNo(rs.getString("insurance_no"));
        s.setTotalFee(rs.getBigDecimal("total_fee")); s.setInsurancePaid(rs.getBigDecimal("insurance_paid"));
        s.setFundPaid(rs.getBigDecimal("fund_paid")); s.setPersonalAccountPaid(rs.getBigDecimal("personal_account_paid"));
        s.setPersonalCashPaid(rs.getBigDecimal("personal_cash_paid")); s.setDeductibleAmount(rs.getBigDecimal("deductible_amount"));
        s.setReimbursementRatio(rs.getBigDecimal("reimbursement_ratio")); s.setSelfPaidRatio(rs.getBigDecimal("self_paid_ratio"));
        s.setSelfPaidAmount(rs.getBigDecimal("self_paid_amount")); s.setSettlementTime(rs.getTimestamp("settlement_time"));
        s.setOperatorId(rs.getInt("operator_id")); s.setOperatorName(rs.getString("operator_name"));
        s.setStatus(rs.getString("status")); s.setCreateTime(rs.getTimestamp("create_time"));
        return s;
    }
}