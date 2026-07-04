package dao;

import bean.DrugPurchaseOrder;
import java.util.List;

public interface DrugPurchaseOrderDAO {
    int insert(DrugPurchaseOrder o);
    int update(DrugPurchaseOrder o);
    List<DrugPurchaseOrder> findAll(String status);
    int cancel(int id);
    DrugPurchaseOrder findById(int id);
}