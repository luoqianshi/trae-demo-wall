package dao;

import bean.InventoryLog;
import java.util.List;

public interface InventoryLogDAO {
    int insert(InventoryLog log);
    int update(InventoryLog log);
    int delete(int id);
    InventoryLog findById(int id);
    List<InventoryLog> findAll();
    List<InventoryLog> findByDrugId(int drugId);
    List<InventoryLog> findByChangeType(String changeType);
}
