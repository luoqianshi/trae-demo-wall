package dao.impl;

import bean.DrugPurchaseOrder;
import dao.DrugPurchaseOrderDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class DrugPurchaseOrderDAOImpl implements DrugPurchaseOrderDAO {

    @Override public int insert(DrugPurchaseOrder o) {
        return JDBCUtil.executeInsert("INSERT INTO drug_purchase_order(purchase_no,supplier_id,supplier_name,order_type,total_amount,drug_count,total_quantity,order_status,order_date,creator_id,creator_name,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
            o.getPurchaseNo(), o.getSupplierId(), o.getSupplierName(), o.getOrderType(), o.getTotalAmount(),
            o.getDrugCount(), o.getTotalQuantity(), "draft", o.getOrderDate(), o.getCreatorId(), o.getCreatorName(), o.getRemark());
    }
    @Override public int update(DrugPurchaseOrder o) {
        return JDBCUtil.executeUpdate("UPDATE drug_purchase_order SET order_status=?,inspector_id=?,inspector_name=?,inspection_time=NOW(),inspection_result=?,warehouse_id=?,warehouse_name=?,warehouser_id=?,warehouser_name=?,warehouse_time=NOW(),finance_status=? WHERE id=?",
            o.getOrderStatus(), o.getInspectorId(), o.getInspectorName(), o.getInspectionResult(),
            o.getWarehouseId(), o.getWarehouseName(), o.getWarehouserId(), o.getWarehouserName(),
            o.getFinanceStatus(), o.getId());
    }
    @Override public int cancel(int id) {
        return JDBCUtil.executeUpdate("UPDATE drug_purchase_order SET order_status='cancelled' WHERE id=?", id);
    }
    @Override public List<DrugPurchaseOrder> findAll(String status) {
        String sql = "SELECT * FROM drug_purchase_order WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (status != null && !status.isEmpty()) { sql += " AND order_status=?"; args.add(status); }
        sql += " ORDER BY order_date DESC";
        return queryList(sql, args.toArray());
    }
    @Override public DrugPurchaseOrder findById(int id) {
        List<DrugPurchaseOrder> list = queryList("SELECT * FROM drug_purchase_order WHERE id=?", id);
        return list.isEmpty() ? null : list.get(0);
    }

    private List<DrugPurchaseOrder> queryList(String sql, Object... params) {
        List<DrugPurchaseOrder> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private DrugPurchaseOrder mapRow(ResultSet rs) throws SQLException {
        DrugPurchaseOrder o = new DrugPurchaseOrder();
        o.setId(rs.getInt("id")); o.setPurchaseNo(rs.getString("purchase_no")); o.setSupplierId(rs.getInt("supplier_id"));
        o.setSupplierName(rs.getString("supplier_name")); o.setOrderType(rs.getString("order_type"));
        o.setTotalAmount(rs.getBigDecimal("total_amount")); o.setDrugCount(rs.getInt("drug_count"));
        o.setTotalQuantity(rs.getInt("total_quantity")); o.setOrderStatus(rs.getString("order_status"));
        o.setInspectorId(rs.getInt("inspector_id")); o.setInspectorName(rs.getString("inspector_name"));
        o.setInspectionTime(rs.getTimestamp("inspection_time")); o.setInspectionResult(rs.getString("inspection_result"));
        o.setWarehouseId(rs.getInt("warehouse_id")); o.setWarehouseName(rs.getString("warehouse_name"));
        o.setWarehouserId(rs.getInt("warehouser_id")); o.setWarehouserName(rs.getString("warehouser_name"));
        o.setWarehouseTime(rs.getTimestamp("warehouse_time")); o.setFinanceStatus(rs.getString("finance_status"));
        o.setFinanceTime(rs.getTimestamp("finance_time")); o.setOrderDate(rs.getDate("order_date"));
        o.setCreatorId(rs.getInt("creator_id")); o.setCreatorName(rs.getString("creator_name"));
        o.setRemark(rs.getString("remark")); o.setCreateTime(rs.getTimestamp("create_time")); o.setUpdateTime(rs.getTimestamp("update_time"));
        return o;
    }
}