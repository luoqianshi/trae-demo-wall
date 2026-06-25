package dao;

import bean.DrugPurchaseItem;
import java.util.List;

public interface DrugPurchaseItemDAO {
    int insert(DrugPurchaseItem item);
    int[] batchInsert(List<DrugPurchaseItem> items);
    List<DrugPurchaseItem> findByPurchaseId(int purchaseId);
    int delete(int id);
}