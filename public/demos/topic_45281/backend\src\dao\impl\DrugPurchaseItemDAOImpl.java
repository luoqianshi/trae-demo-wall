package dao.impl;

import bean.DrugPurchaseItem;
import dao.DrugPurchaseItemDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class DrugPurchaseItemDAOImpl implements DrugPurchaseItemDAO {

    @Override public int insert(DrugPurchaseItem item) {
        return JDBCUtil.executeInsert("INSERT INTO drug_purchase_item(purchase_id,drug_id,drug_name,drug_spec,drug_unit,batch_no,expire_date,quantity,received_quantity,unit_price,total_price,discount_ratio,discount_amount,tax_rate,tax_amount,production_date,manufacturer,storage_condition,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            item.getPurchaseId(), item.getDrugId(), item.getDrugName(), item.getDrugSpec(), item.getDrugUnit(),
            item.getBatchNo(), item.getExpireDate(), item.getQuantity(), item.getReceivedQuantity(),
            item.getUnitPrice(), item.getTotalPrice(), item.getDiscountRatio(), item.getDiscountAmount(),
            item.getTaxRate(), item.getTaxAmount(), item.getProductionDate(), item.getManufacturer(),
            item.getStorageCondition(), item.getRemark());
    }
    @Override public int[] batchInsert(List<DrugPurchaseItem> items) {
        int[] ids = new int[items.size()];
        for (int i = 0; i < items.size(); i++) { ids[i] = insert(items.get(i)); }
        return ids;
    }
    @Override public List<DrugPurchaseItem> findByPurchaseId(int purchaseId) {
        return queryList("SELECT * FROM drug_purchase_item WHERE purchase_id=?", purchaseId);
    }
    @Override public int delete(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM drug_purchase_item WHERE id=?", id);
    }

    private List<DrugPurchaseItem> queryList(String sql, Object... params) {
        List<DrugPurchaseItem> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private DrugPurchaseItem mapRow(ResultSet rs) throws SQLException {
        DrugPurchaseItem item = new DrugPurchaseItem();
        item.setId(rs.getInt("id")); item.setPurchaseId(rs.getInt("purchase_id")); item.setDrugId(rs.getInt("drug_id"));
        item.setDrugName(rs.getString("drug_name")); item.setDrugSpec(rs.getString("drug_spec"));
        item.setDrugUnit(rs.getString("drug_unit")); item.setBatchNo(rs.getString("batch_no"));
        item.setExpireDate(rs.getDate("expire_date")); item.setQuantity(rs.getInt("quantity"));
        item.setReceivedQuantity(rs.getInt("received_quantity")); item.setUnitPrice(rs.getBigDecimal("unit_price"));
        item.setTotalPrice(rs.getBigDecimal("total_price")); item.setDiscountRatio(rs.getBigDecimal("discount_ratio"));
        item.setDiscountAmount(rs.getBigDecimal("discount_amount")); item.setTaxRate(rs.getBigDecimal("tax_rate"));
        item.setTaxAmount(rs.getBigDecimal("tax_amount")); item.setProductionDate(rs.getDate("production_date"));
        item.setManufacturer(rs.getString("manufacturer")); item.setStorageCondition(rs.getString("storage_condition"));
        item.setRemark(rs.getString("remark"));
        return item;
    }
}