package service;

import bean.Drug;
import bean.InventoryLog;
import dao.DrugDAO;
import dao.impl.DrugDAOImpl;
import dao.impl.InventoryLogDAOImpl;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

public class DrugService {
    private DrugDAO drugDAO = new DrugDAOImpl();

    public int addDrug(Drug drug) {
        return drugDAO.insert(drug);
    }

    public int updateDrug(Drug drug) {
        return drugDAO.update(drug);
    }

    public int deleteDrug(int id) {
        return drugDAO.delete(id);
    }

    public Drug getDrugById(int id) {
        return drugDAO.findById(id);
    }

    public List<Drug> getAllDrugs() {
        return drugDAO.findAll();
    }

    public List<Drug> searchDrugs(String keyword) {
        return drugDAO.findByKeyword(keyword);
    }

    public boolean updateStock(int drugId, int num) {
        int result = drugDAO.updateStock(drugId, num);
        return result > 0;
    }

    public boolean deductStock(int drugId, int quantity, String operator) {
        Drug drug = drugDAO.findById(drugId);
        if (drug == null) return false;
        if (drug.getStock() < quantity) return false;

        int beforeStock = drug.getStock();
        int result = drugDAO.updateStock(drugId, -quantity);

        if (result > 0) {
            InventoryLog log = new InventoryLog();
            log.setDrugId(drugId);
            log.setChangeType("处方发药");
            log.setChangeNum(-quantity);
            log.setBeforeStock(beforeStock);
            log.setAfterStock(beforeStock - quantity);
            log.setOperator(operator);
            log.setChangeTime(new Date());
            log.setReason("处方开立扣减库存");
            new InventoryLogDAOImpl().insert(log);
            return true;
        }
        return false;
    }

    public boolean restoreStock(int drugId, int quantity, String operator) {
        Drug drug = drugDAO.findById(drugId);
        if (drug == null) return false;

        int beforeStock = drug.getStock();
        int result = drugDAO.updateStock(drugId, quantity);

        if (result > 0) {
            InventoryLog log = new InventoryLog();
            log.setDrugId(drugId);
            log.setChangeType("处方作废回补");
            log.setChangeNum(quantity);
            log.setBeforeStock(beforeStock);
            log.setAfterStock(beforeStock + quantity);
            log.setOperator(operator);
            log.setChangeTime(new Date());
            log.setReason("处方作废回补库存");
            new InventoryLogDAOImpl().insert(log);
            return true;
        }
        return false;
    }

    public BigDecimal getDrugTotalPrice(int drugId, int num) {
        Drug drug = drugDAO.findById(drugId);
        if (drug != null) {
            return drug.getPrice().multiply(new BigDecimal(num));
        }
        return BigDecimal.ZERO;
    }

    public boolean isUsedInPrescription(int drugId) {
        return drugDAO.isUsedInPrescription(drugId);
    }

    public boolean isUsedInStockLog(int drugId) {
        return drugDAO.isUsedInStockLog(drugId);
    }

    public boolean canDelete(int drugId) {
        return !isUsedInPrescription(drugId) && !isUsedInStockLog(drugId);
    }

    public DrugWarnings getDrugWarnings() {
        DrugWarnings warnings = new DrugWarnings();
        warnings.lowStock = drugDAO.findLowStock();
        warnings.expiring = drugDAO.findExpiring();
        warnings.expired = drugDAO.findExpired();
        return warnings;
    }

    public static class DrugWarnings {
        public List<Drug> lowStock;
        public List<Drug> expiring;
        public List<Drug> expired;
    }
}
