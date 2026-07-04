package service;

import bean.InventoryLog;
import dao.InventoryLogDAO;
import dao.impl.InventoryLogDAOImpl;
import java.util.List;

public class InventoryLogService {
    private InventoryLogDAO inventoryLogDAO = new InventoryLogDAOImpl();

    public int addInventoryLog(InventoryLog log) {
        return inventoryLogDAO.insert(log);
    }

    public int updateInventoryLog(InventoryLog log) {
        return inventoryLogDAO.update(log);
    }

    public int deleteInventoryLog(int id) {
        return inventoryLogDAO.delete(id);
    }

    public InventoryLog getInventoryLogById(int id) {
        return inventoryLogDAO.findById(id);
    }

    public List<InventoryLog> getAllInventoryLogs() {
        return inventoryLogDAO.findAll();
    }

    public List<InventoryLog> getInventoryLogsByDrugId(int drugId) {
        return inventoryLogDAO.findByDrugId(drugId);
    }

    public List<InventoryLog> getInventoryLogsByChangeType(String changeType) {
        return inventoryLogDAO.findByChangeType(changeType);
    }
}
