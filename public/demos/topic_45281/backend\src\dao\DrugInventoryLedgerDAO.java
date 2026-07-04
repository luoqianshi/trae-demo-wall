package dao;

import bean.DrugInventoryLedger;
import java.util.List;

public interface DrugInventoryLedgerDAO {
    int insert(DrugInventoryLedger l);
    int update(DrugInventoryLedger l);
    List<DrugInventoryLedger> findAll(String warehouse, String drugName);
    int delete(int id);
}