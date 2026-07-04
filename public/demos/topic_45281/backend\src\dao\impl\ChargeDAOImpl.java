package dao.impl;

import util.JDBCUtil;
import bean.Charge;
import dao.ChargeDAO;
import java.util.ArrayList;
import java.util.List;

public class ChargeDAOImpl implements ChargeDAO {
    @Override
    public int insert(Charge charge) {
        String sql = "INSERT INTO charge(patient_id, patient_name, charge_type, relate_id, total_fee, charge_time, operator, payment_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, charge.getPatientId(), charge.getPatientName(), charge.getChargeType(), charge.getRelateId(), charge.getTotalFee(), charge.getChargeTime(), charge.getOperator(), charge.getPaymentType(), charge.getStatus());
    }

    @Override
    public int update(Charge charge) {
        String sql = "UPDATE charge SET status = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, charge.getStatus(), charge.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM charge WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public Charge findById(int id) {
        String sql = "SELECT * FROM charge WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToCharge(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Charge> findAll() {
        String sql = "SELECT * FROM charge";
        List<Charge> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToCharge(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Charge> findByPatientId(int patientId) {
        String sql = "SELECT * FROM charge WHERE patient_id = ?";
        List<Charge> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, patientId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToCharge(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<Charge> findByPrescriptionId(int prescriptionId) {
        String sql = "SELECT * FROM charge WHERE charge_type = 'prescription' AND relate_id = ?";
        List<Charge> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, prescriptionId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToCharge(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private Charge mapToCharge(java.sql.ResultSet rs) throws Exception {
        Charge charge = new Charge();
        charge.setId(rs.getInt("id"));
        charge.setPatientId(rs.getInt("patient_id"));
        try { charge.setPatientName(rs.getString("patient_name")); } catch (Exception e) { e.printStackTrace(); }
        charge.setChargeType(rs.getString("charge_type"));
        charge.setRelateId(rs.getInt("relate_id"));
        charge.setTotalFee(rs.getBigDecimal("total_fee"));
        charge.setChargeTime(rs.getTimestamp("charge_time"));
        charge.setOperator(rs.getString("operator"));
        charge.setPaymentType(rs.getString("payment_type"));
        charge.setStatus(rs.getString("status"));
        return charge;
    }
}

