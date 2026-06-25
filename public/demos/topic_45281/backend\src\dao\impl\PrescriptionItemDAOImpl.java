package dao.impl;

import util.JDBCUtil;
import bean.PrescriptionItem;
import dao.PrescriptionItemDAO;
import java.util.ArrayList;
import java.util.List;

public class PrescriptionItemDAOImpl implements PrescriptionItemDAO {
    @Override
    public int insert(PrescriptionItem item) {
        String sql = "INSERT INTO prescription_item(prescription_id, drug_id, num, drug_price, drug_usage, days, drug_name, drug_spec) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeUpdate(sql, item.getPrescriptionId(), item.getDrugId(), item.getNum(), item.getDrugPrice(), item.getUsage(), item.getDays(), item.getDrugName(), item.getDrugSpec());
    }

    @Override
    public int update(PrescriptionItem item) {
        String sql = "UPDATE prescription_item SET prescription_id = ?, drug_id = ?, num = ?, drug_price = ?, drug_usage = ?, days = ?, drug_name = ?, drug_spec = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, item.getPrescriptionId(), item.getDrugId(), item.getNum(), item.getDrugPrice(), item.getUsage(), item.getDays(), item.getDrugName(), item.getDrugSpec(), item.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM prescription_item WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public int deleteByPrescriptionId(int prescriptionId) {
        String sql = "DELETE FROM prescription_item WHERE prescription_id = ?";
        return JDBCUtil.executeUpdate(sql, prescriptionId);
    }

    @Override
    public PrescriptionItem findById(int id) {
        String sql = "SELECT * FROM prescription_item WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToItem(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<PrescriptionItem> findByPrescriptionId(int prescriptionId) {
        String sql = "SELECT * FROM prescription_item WHERE prescription_id = ?";
        List<PrescriptionItem> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, prescriptionId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToItem(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<PrescriptionItem> findAll() {
        String sql = "SELECT * FROM prescription_item";
        List<PrescriptionItem> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToItem(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<PrescriptionItem> findByDrugId(int drugId) {
        String sql = "SELECT * FROM prescription_item WHERE drug_id = ?";
        List<PrescriptionItem> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, drugId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToItem(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private PrescriptionItem mapToItem(java.sql.ResultSet rs) throws Exception {
        PrescriptionItem item = new PrescriptionItem();
        item.setId(rs.getInt("id"));
        item.setPrescriptionId(rs.getInt("prescription_id"));
        item.setDrugId(rs.getInt("drug_id"));
        item.setNum(rs.getInt("num"));
        item.setDrugPrice(rs.getBigDecimal("drug_price"));
        item.setUsage(rs.getString("drug_usage"));
        item.setDays(rs.getInt("days"));
        item.setDrugName(rs.getString("drug_name"));
        item.setDrugSpec(rs.getString("drug_spec"));
        return item;
    }
}
