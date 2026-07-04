package service;

import util.JDBCUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

public class PharmacyDispenseService {

    public static class DispenseResult {
        private final boolean success;
        private final String message;
        private final List<String> insufficientDrugs;

        private DispenseResult(boolean success, String message, List<String> insufficientDrugs) {
            this.success = success;
            this.message = message;
            this.insufficientDrugs = insufficientDrugs;
        }

        public static DispenseResult ok() {
            return new DispenseResult(true, "发药成功，库存已扣减", new ArrayList<>());
        }

        public static DispenseResult fail(String message) {
            return new DispenseResult(false, message, new ArrayList<>());
        }

        public static DispenseResult insufficient(List<String> drugs) {
            return new DispenseResult(false, "库存不足", drugs);
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
        public List<String> getInsufficientDrugs() { return insufficientDrugs; }
    }

    private static class PrescriptionItemRow {
        int drugId;
        int num;
    }

    private static class DrugStockRow {
        int id;
        String name;
        int stock;
    }

    public DispenseResult dispense(int prescriptionId, String operator) {
        Connection conn = null;
        try {
            conn = JDBCUtil.beginTransaction();

            String currentStatus = getPrescriptionStatus(conn, prescriptionId);
            if (currentStatus == null) return rollback(conn, "处方不存在");
            if ("dispensed".equals(currentStatus) || "已发药".equals(currentStatus)) {
                return rollback(conn, "处方已发药，不能重复发药");
            }
            if (!hasPaidCharge(conn, prescriptionId)) {
                return rollback(conn, "处方未收费或收费未完成，不能发药");
            }

            List<PrescriptionItemRow> items = getPrescriptionItems(conn, prescriptionId);
            if (items.isEmpty()) return rollback(conn, "处方无药品明细，不能发药");

            List<String> insufficient = new ArrayList<>();
            List<DrugStockRow> drugRows = new ArrayList<>();
            for (PrescriptionItemRow item : items) {
                DrugStockRow drug = getDrugForUpdate(conn, item.drugId);
                if (drug == null) {
                    insufficient.add("药品#" + item.drugId + " 不存在");
                } else if (drug.stock < item.num) {
                    insufficient.add(drug.name + "（需要 " + item.num + "，库存 " + drug.stock + "）");
                    drugRows.add(drug);
                } else {
                    drugRows.add(drug);
                }
            }
            if (!insufficient.isEmpty()) {
                JDBCUtil.rollback(conn);
                return DispenseResult.insufficient(insufficient);
            }

            // 扣减库存并记录日志
            for (PrescriptionItemRow item : items) {
                DrugStockRow drug = findDrugRow(drugRows, item.drugId);
                int afterStock = drug.stock - item.num;
                JDBCUtil.executeUpdate(conn, "UPDATE drug SET stock=? WHERE id=?", afterStock, item.drugId);
                JDBCUtil.executeInsert(conn,
                    "INSERT INTO inventory_log(drug_id, change_type, change_num, before_stock, after_stock, operator, reason) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    item.drugId, "dispense", -item.num, drug.stock, afterStock,
                    operator != null && !operator.isEmpty() ? operator : "药房",
                    "发药扣减库存 - 处方ID: " + prescriptionId);
            }

            JDBCUtil.executeUpdate(conn, "UPDATE prescription SET status=? WHERE id=?", "dispensed", prescriptionId);
            JDBCUtil.commit(conn);
            return DispenseResult.ok();
        } catch (Exception e) {
            JDBCUtil.rollback(conn);
            e.printStackTrace();
            return DispenseResult.fail("发药失败：" + e.getMessage());
        }
    }

    private DispenseResult rollback(Connection conn, String message) {
        JDBCUtil.rollback(conn);
        return DispenseResult.fail(message);
    }

    private String getPrescriptionStatus(Connection conn, int prescriptionId) throws Exception {
        try (PreparedStatement stmt = conn.prepareStatement("SELECT status FROM prescription WHERE id=? FOR UPDATE")) {
            stmt.setInt(1, prescriptionId);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() ? rs.getString("status") : null;
            }
        }
    }

    private boolean hasPaidCharge(Connection conn, int prescriptionId) throws Exception {
        try (PreparedStatement stmt = conn.prepareStatement("SELECT COUNT(*) FROM charge WHERE charge_type='prescription' AND relate_id=? AND status='paid'")) {
            stmt.setInt(1, prescriptionId);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next() && rs.getInt(1) > 0;
            }
        }
    }

    private List<PrescriptionItemRow> getPrescriptionItems(Connection conn, int prescriptionId) throws Exception {
        List<PrescriptionItemRow> items = new ArrayList<>();
        try (PreparedStatement stmt = conn.prepareStatement("SELECT drug_id, num FROM prescription_item WHERE prescription_id=?")) {
            stmt.setInt(1, prescriptionId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    PrescriptionItemRow item = new PrescriptionItemRow();
                    item.drugId = rs.getInt("drug_id");
                    item.num = rs.getInt("num");
                    items.add(item);
                }
            }
        }
        return items;
    }

    private DrugStockRow getDrugForUpdate(Connection conn, int drugId) throws Exception {
        try (PreparedStatement stmt = conn.prepareStatement("SELECT id, name, stock FROM drug WHERE id=? FOR UPDATE")) {
            stmt.setInt(1, drugId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (!rs.next()) return null;
                DrugStockRow row = new DrugStockRow();
                row.id = rs.getInt("id");
                row.name = rs.getString("name");
                row.stock = rs.getInt("stock");
                return row;
            }
        }
    }

    private DrugStockRow findDrugRow(List<DrugStockRow> rows, int drugId) {
        for (DrugStockRow row : rows) {
            if (row.id == drugId) return row;
        }
        return null;
    }
}
