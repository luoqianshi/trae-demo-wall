package dao;

import bean.DrugTransferOrder;
import java.util.List;

public interface DrugTransferOrderDAO {
    int insert(DrugTransferOrder o);
    int update(DrugTransferOrder o);
    List<DrugTransferOrder> findAll(String status);
    int cancel(int id);
    DrugTransferOrder findById(int id);
}