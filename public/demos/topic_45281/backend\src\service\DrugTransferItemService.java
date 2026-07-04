package service;

import bean.DrugTransferItem;
import dao.DrugTransferItemDAO;
import dao.impl.DrugTransferItemDAOImpl;
import java.util.List;

public class DrugTransferItemService {
    private DrugTransferItemDAO dao = new DrugTransferItemDAOImpl();

    public int add(DrugTransferItem item) { return dao.insert(item); }
    public int[] batchAdd(List<DrugTransferItem> items) { return dao.batchInsert(items); }
    public List<DrugTransferItem> getByTransferId(int transferId) { return dao.findByTransferId(transferId); }
    public int delete(int id) { return dao.delete(id); }
}