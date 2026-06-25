package dao.impl;

import util.JDBCUtil;
import bean.InventoryLog;
import dao.InventoryLogDAO;
import java.util.ArrayList;
import java.util.List;

public class InventoryLogDAOImpl implements InventoryLogDAO {
    @Override
    public int insert(InventoryLog log) {
        String sql = "INSERT INTO inventory_log(drug_id, change_type, change_num, before_stock, after_stock, operator, reason) VALUES (?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeUpdate(sql, log.getDrugId(), log.getChangeType(), log.getChangeNum(), log.getBeforeStock(), log.getAfterStock(), log.getOperator(), log.getReason());
    }

    @Override
    public int update(InventoryLog log) {
        String sql = "UPDATE inventory_log SET drug_id = ?, change_type = ?, change_num = ?, before_stock = ?, after_stock = ?, operator = ?, reason = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, log.getDrugId(), log.getChangeType(), log.getChangeNum(), log.getBeforeStock(), log.getAfterStock(), log.getOperator(), log.getReason(), log.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM inventory_log WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public InventoryLog findById(int id) {
        String sql = "SELECT * FROM inventory_log WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToInventoryLog(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<InventoryLog> findAll() {
        String sql = "SELECT * FROM inventory_log ORDER BY change_time DESC";
        List<InventoryLog> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToInventoryLog(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<InventoryLog> findByDrugId(int drugId) {
        String sql = "SELECT * FROM inventory_log WHERE drug_id = ? ORDER BY change_time DESC";
        List<InventoryLog> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, drugId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToInventoryLog(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<InventoryLog> findByChangeType(String changeType) {
        String sql = "SELECT * FROM inventory_log WHERE change_type = ? ORDER BY change_time DESC";
        List<InventoryLog> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, changeType)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToInventoryLog(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private InventoryLog mapToInventoryLog(java.sql.ResultSet rs) throws Exception {
        InventoryLog log = new InventoryLog();
        log.setId(rs.getInt("id"));
        log.setDrugId(rs.getInt("drug_id"));
        log.setChangeType(rs.getString("change_type"));
        log.setChangeNum(rs.getInt("change_num"));
        log.setBeforeStock(rs.getInt("before_stock"));
        log.setAfterStock(rs.getInt("after_stock"));
        log.setOperator(rs.getString("operator"));
        log.setChangeTime(rs.getTimestamp("change_time"));
        log.setReason(rs.getString("reason"));
        return log;
    }
}
