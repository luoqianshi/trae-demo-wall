package service;

import bean.DrugPurchaseItem;
import dao.DrugPurchaseItemDAO;
import dao.impl.DrugPurchaseItemDAOImpl;
import java.util.List;

public class DrugPurchaseItemService {
    private DrugPurchaseItemDAO dao = new DrugPurchaseItemDAOImpl();

    public int add(DrugPurchaseItem item) { return dao.insert(item); }
    public int[] batchAdd(List<DrugPurchaseItem> items) { return dao.batchInsert(items); }
    public List<DrugPurchaseItem> getByPurchaseId(int purchaseId) { return dao.findByPurchaseId(purchaseId); }
    public int delete(int id) { return dao.delete(id); }
}