package dao.impl;

import bean.DrugTransferItem;
import dao.DrugTransferItemDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class DrugTransferItemDAOImpl implements DrugTransferItemDAO {

    @Override public int insert(DrugTransferItem item) {
        return JDBCUtil.executeInsert("INSERT INTO drug_transfer_item(transfer_id,drug_id,drug_name,drug_spec,batch_no,expire_date,quantity,received_quantity,unit_price,total_price,remark) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
            item.getTransferId(), item.getDrugId(), item.getDrugName(), item.getDrugSpec(), item.getBatchNo(),
            item.getExpireDate(), item.getQuantity(), item.getReceivedQuantity(), item.getUnitPrice(),
            item.getTotalPrice(), item.getRemark());
    }
    @Override public int[] batchInsert(List<DrugTransferItem> items) {
        int[] ids = new int[items.size()];
        for (int i = 0; i < items.size(); i++) { ids[i] = insert(items.get(i)); }
        return ids;
    }
    @Override public List<DrugTransferItem> findByTransferId(int transferId) {
        return queryList("SELECT * FROM drug_transfer_item WHERE transfer_id=?", transferId);
    }
    @Override public int delete(int id) {
        return JDBCUtil.executeUpdate("DELETE FROM drug_transfer_item WHERE id=?", id);
    }

    private List<DrugTransferItem> queryList(String sql, Object... params) {
        List<DrugTransferItem> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private DrugTransferItem mapRow(ResultSet rs) throws SQLException {
        DrugTransferItem item = new DrugTransferItem();
        item.setId(rs.getInt("id")); item.setTransferId(rs.getInt("transfer_id")); item.setDrugId(rs.getInt("drug_id"));
        item.setDrugName(rs.getString("drug_name")); item.setDrugSpec(rs.getString("drug_spec"));
        item.setBatchNo(rs.getString("batch_no")); item.setExpireDate(rs.getDate("expire_date"));
        item.setQuantity(rs.getInt("quantity")); item.setReceivedQuantity(rs.getInt("received_quantity"));
        item.setUnitPrice(rs.getBigDecimal("unit_price")); item.setTotalPrice(rs.getBigDecimal("total_price"));
        item.setRemark(rs.getString("remark"));
        return item;
    }
}