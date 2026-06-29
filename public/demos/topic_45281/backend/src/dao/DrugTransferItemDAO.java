package dao;

import bean.DrugTransferItem;
import java.util.List;

public interface DrugTransferItemDAO {
    int insert(DrugTransferItem item);
    int[] batchInsert(List<DrugTransferItem> items);
    List<DrugTransferItem> findByTransferId(int transferId);
    int delete(int id);
}