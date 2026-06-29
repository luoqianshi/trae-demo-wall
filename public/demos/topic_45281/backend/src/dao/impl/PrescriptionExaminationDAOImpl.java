package dao.impl;

import util.JDBCUtil;
import bean.PrescriptionExamination;
import dao.PrescriptionExaminationDAO;
import java.util.ArrayList;
import java.util.List;

public class PrescriptionExaminationDAOImpl implements PrescriptionExaminationDAO {
    @Override
    public int insert(PrescriptionExamination pe) {
        String sql = "INSERT INTO prescription_examination(prescription_id, examination_id, examination_name, category, quantity, price, total_price, status, result, dept, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, pe.getPrescriptionId(), pe.getExaminationId(), pe.getExaminationName(), pe.getCategory(), pe.getQuantity(), pe.getPrice(), pe.getTotalPrice(), pe.getStatus(), pe.getResult(), pe.getDept(), pe.getRemark());
    }

    @Override
    public int update(PrescriptionExamination pe) {
        String sql = "UPDATE prescription_examination SET prescription_id = ?, examination_id = ?, examination_name = ?, category = ?, quantity = ?, price = ?, total_price = ?, status = ?, result = ?, dept = ?, remark = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, pe.getPrescriptionId(), pe.getExaminationId(), pe.getExaminationName(), pe.getCategory(), pe.getQuantity(), pe.getPrice(), pe.getTotalPrice(), pe.getStatus(), pe.getResult(), pe.getDept(), pe.getRemark(), pe.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM prescription_examination WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public PrescriptionExamination findById(int id) {
        String sql = "SELECT * FROM prescription_examination WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToPrescriptionExamination(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<PrescriptionExamination> findAll() {
        String sql = "SELECT * FROM prescription_examination";
        List<PrescriptionExamination> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPrescriptionExamination(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<PrescriptionExamination> findByPrescriptionId(int prescriptionId) {
        String sql = "SELECT * FROM prescription_examination WHERE prescription_id = ?";
        List<PrescriptionExamination> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, prescriptionId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToPrescriptionExamination(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public int deleteByPrescriptionId(int prescriptionId) {
        String sql = "DELETE FROM prescription_examination WHERE prescription_id = ?";
        return JDBCUtil.executeUpdate(sql, prescriptionId);
    }

    private PrescriptionExamination mapToPrescriptionExamination(java.sql.ResultSet rs) throws Exception {
        PrescriptionExamination pe = new PrescriptionExamination();
        pe.setId(rs.getInt("id"));
        pe.setPrescriptionId(rs.getInt("prescription_id"));
        pe.setExaminationId(rs.getInt("examination_id"));
        try { pe.setExaminationName(rs.getString("examination_name")); } catch (Exception e) { e.printStackTrace(); }
        try { pe.setCategory(rs.getString("category")); } catch (Exception e) { e.printStackTrace(); }
        pe.setQuantity(rs.getInt("quantity"));
        try { pe.setPrice(rs.getBigDecimal("price")); } catch (Exception e) { e.printStackTrace(); }
        try { pe.setTotalPrice(rs.getBigDecimal("total_price")); } catch (Exception e) { e.printStackTrace(); }
        pe.setStatus(rs.getString("status"));
        pe.setResult(rs.getString("result"));
        try { pe.setDept(rs.getString("dept")); } catch (Exception e) { e.printStackTrace(); }
        try { pe.setRemark(rs.getString("remark")); } catch (Exception e) { e.printStackTrace(); }
        pe.setCreateTime(rs.getTimestamp("create_time"));
        return pe;
    }
}

