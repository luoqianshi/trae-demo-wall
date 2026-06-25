package dao.impl;

import bean.ChargeItem;
import dao.ChargeItemDAO;
import util.JDBCUtil;
import java.util.ArrayList;
import java.util.List;

public class ChargeItemDAOImpl implements ChargeItemDAO {
    @Override
    public int insert(ChargeItem item) {
        String sql = "INSERT INTO charge_item(charge_id, item_type, relate_id, item_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, item.getChargeId(), item.getItemType(), item.getRelateId(), item.getItemName(), item.getQuantity(), item.getUnitPrice(), item.getTotalPrice());
    }

    @Override
    public List<ChargeItem> findByChargeId(int chargeId) {
        String sql = "SELECT * FROM charge_item WHERE charge_id = ?";
        List<ChargeItem> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, chargeId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToChargeItem(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<ChargeItem> findAll() {
        String sql = "SELECT * FROM charge_item";
        List<ChargeItem> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToChargeItem(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public int deleteByChargeId(int chargeId) {
        String sql = "DELETE FROM charge_item WHERE charge_id = ?";
        return JDBCUtil.executeUpdate(sql, chargeId);
    }

    private ChargeItem mapToChargeItem(java.sql.ResultSet rs) throws Exception {
        ChargeItem item = new ChargeItem();
        item.setId(rs.getInt("id"));
        item.setChargeId(rs.getInt("charge_id"));
        item.setItemType(rs.getString("item_type"));
        item.setRelateId(rs.getInt("relate_id"));
        item.setItemName(rs.getString("item_name"));
        item.setQuantity(rs.getInt("quantity"));
        item.setUnitPrice(rs.getBigDecimal("unit_price"));
        item.setTotalPrice(rs.getBigDecimal("total_price"));
        return item;
    }
}
