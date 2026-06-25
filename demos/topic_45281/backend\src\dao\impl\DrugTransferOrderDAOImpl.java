package dao.impl;

import bean.DrugTransferOrder;
import dao.DrugTransferOrderDAO;
import util.JDBCUtil;
import java.sql.*;
import java.util.*;

public class DrugTransferOrderDAOImpl implements DrugTransferOrderDAO {

    @Override public int insert(DrugTransferOrder o) {
        return JDBCUtil.executeInsert("INSERT INTO drug_transfer_order(transfer_no,source_warehouse,target_warehouse,transfer_type,total_items,total_quantity,status,applicant_id,applicant_name,remark) VALUES(?,?,?,?,?,?,?,?,?,?)",
            o.getTransferNo(), o.getSourceWarehouse(), o.getTargetWarehouse(), o.getTransferType(),
            o.getTotalItems(), o.getTotalQuantity(), "draft", o.getApplicantId(), o.getApplicantName(), o.getRemark());
    }
    @Override public int update(DrugTransferOrder o) {
        return JDBCUtil.executeUpdate("UPDATE drug_transfer_order SET status=?,approver_id=?,approver_name=?,approve_time=NOW(),sender_id=?,sender_name=?,send_time=NOW(),receiver_id=?,receiver_name=?,receive_time=NOW() WHERE id=?",
            o.getStatus(), o.getApproverId(), o.getApproverName(), o.getSenderId(), o.getSenderName(),
            o.getReceiverId(), o.getReceiverName(), o.getId());
    }
    @Override public int cancel(int id) {
        return JDBCUtil.executeUpdate("UPDATE drug_transfer_order SET status='cancelled' WHERE id=?", id);
    }
    @Override public List<DrugTransferOrder> findAll(String status) {
        String sql = "SELECT * FROM drug_transfer_order WHERE 1=1";
        List<Object> args = new ArrayList<>();
        if (status != null && !status.isEmpty()) { sql += " AND status=?"; args.add(status); }
        sql += " ORDER BY create_time DESC";
        return queryList(sql, args.toArray());
    }
    @Override public DrugTransferOrder findById(int id) {
        List<DrugTransferOrder> list = queryList("SELECT * FROM drug_transfer_order WHERE id=?", id);
        return list.isEmpty() ? null : list.get(0);
    }

    private List<DrugTransferOrder> queryList(String sql, Object... params) {
        List<DrugTransferOrder> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, params)) {
            if (qr != null) { while (qr.getResultSet().next()) { list.add(mapRow(qr.getResultSet())); } }
        } catch (Exception e) { e.printStackTrace(); }
        return list;
    }
    private DrugTransferOrder mapRow(ResultSet rs) throws SQLException {
        DrugTransferOrder o = new DrugTransferOrder();
        o.setId(rs.getInt("id")); o.setTransferNo(rs.getString("transfer_no")); o.setSourceWarehouse(rs.getString("source_warehouse"));
        o.setTargetWarehouse(rs.getString("target_warehouse")); o.setTransferType(rs.getString("transfer_type"));
        o.setTotalItems(rs.getInt("total_items")); o.setTotalQuantity(rs.getInt("total_quantity"));
        o.setStatus(rs.getString("status")); o.setApplicantId(rs.getInt("applicant_id"));
        o.setApplicantName(rs.getString("applicant_name")); o.setApproverId(rs.getObject("approver_id") != null ? rs.getInt("approver_id") : 0);
        o.setApproverName(rs.getString("approver_name")); o.setApproveTime(rs.getTimestamp("approve_time"));
        o.setSenderId(rs.getObject("sender_id") != null ? rs.getInt("sender_id") : 0);
        o.setSenderName(rs.getString("sender_name")); o.setSendTime(rs.getTimestamp("send_time"));
        o.setReceiverId(rs.getObject("receiver_id") != null ? rs.getInt("receiver_id") : 0);
        o.setReceiverName(rs.getString("receiver_name")); o.setReceiveTime(rs.getTimestamp("receive_time"));
        o.setRemark(rs.getString("remark")); o.setCreateTime(rs.getTimestamp("create_time")); o.setUpdateTime(rs.getTimestamp("update_time"));
        return o;
    }
}