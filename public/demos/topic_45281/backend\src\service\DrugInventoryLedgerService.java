package service;

import bean.DrugInventoryLedger;
import dao.DrugInventoryLedgerDAO;
import dao.impl.DrugInventoryLedgerDAOImpl;
import java.util.List;

public class DrugInventoryLedgerService {
    private DrugInventoryLedgerDAO dao = new DrugInventoryLedgerDAOImpl();

    public int add(DrugInventoryLedger l) { return dao.insert(l); }
    public int update(DrugInventoryLedger l) { return dao.update(l); }
    public List<DrugInventoryLedger> getAll(String warehouse, String drugName) { return dao.findAll(warehouse, drugName); }
    public int delete(int id) { return dao.delete(id); }
}