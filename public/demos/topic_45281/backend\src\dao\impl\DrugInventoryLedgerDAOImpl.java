package dao.impl;

import bean.DrugInventoryLedger;
import dao.DrugInventoryLedgerDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class DrugInventoryLedgerDAOImpl implements DrugInventoryLedgerDAO {

    @Override public int insert(DrugInventoryLedger l) {
        return JDBCUtil.executeInsert("INSERT INTO drug_inventory_ledger(drug_id,drug_name,batch_no,expire_date,warehouse_type,warehouse_name,quantity,unit_price,total_amount,min_stock,max_stock,location_code) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
            l.getDrugId(), l.getDrugName(), l.getBatchNo(), l.getExpireDate(), l.getWarehouseType(), l.getWarehouseName(),
            l.getQuantity(), l.getUnitPrice(), l.getTotalAmount(), l.getMinStock(), l.getMaxStock(), l.getLocationCode());
    }
    @Override public int update(DrugInventoryLedger l) {
        return JDBCUtil.executeUpdate("UPDATE drug_inventory_ledger SET quantity=?,total_amount=quantity*unit_price,last_in_time=NOW() WHERE id=?",
            l.getQuantity(), l.getId());
    }
    @Override public List<DrugInventoryLedger> findAll(String warehouse, String drugName) {
        String sql = "SELECT * FROM drug_inventory_ledger WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (warehouse != null && !warehouse.isEmpty()) { sql += " AND warehouse_type=?"; args.add(warehouse); }
        if (drugName != null && !drugName.isEmpty()) { sql += " AND drug_name LIKE ?"; args.add("%" + drugName + "%"); }
        sql += " ORDER BY expire_date ASC";
        return queryList(sql, args.toArray());
    }
    @Override public int delete(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM drug_inventory_ledger WHERE id=?", id);
    }

    private List<DrugInventoryLedger> queryList(String sql, Object... params) {
        List<DrugInventoryLedger> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private DrugInventoryLedger mapRow(ResultSet rs) throws SQLException {
        DrugInventoryLedger l = new DrugInventoryLedger();
        l.setId(rs.getInt("id")); l.setDrugId(rs.getInt("drug_id")); l.setDrugName(rs.getString("drug_name"));
        l.setBatchNo(rs.getString("batch_no")); l.setExpireDate(rs.getDate("expire_date"));
        l.setWarehouseType(rs.getString("warehouse_type")); l.setWarehouseName(rs.getString("warehouse_name"));
        l.setQuantity(rs.getInt("quantity")); l.setUnitPrice(rs.getBigDecimal("unit_price"));
        l.setTotalAmount(rs.getBigDecimal("total_amount")); l.setMinStock(rs.getInt("min_stock"));
        l.setMaxStock(rs.getInt("max_stock")); l.setLocationCode(rs.getString("location_code"));
        l.setLastInTime(rs.getTimestamp("last_in_time")); l.setLastOutTime(rs.getTimestamp("last_out_time"));
        l.setCreateTime(rs.getTimestamp("create_time")); l.setUpdateTime(rs.getTimestamp("update_time"));
        return l;
    }
}