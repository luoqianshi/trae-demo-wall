package service;

import bean.DrugPurchaseOrder;
import dao.DrugPurchaseOrderDAO;
import dao.impl.DrugPurchaseOrderDAOImpl;
import java.util.List;

public class DrugPurchaseOrderService {
    private DrugPurchaseOrderDAO dao = new DrugPurchaseOrderDAOImpl();

    public int add(DrugPurchaseOrder o) { return dao.insert(o); }
    public int update(DrugPurchaseOrder o) { return dao.update(o); }
    public int cancel(int id) { return dao.cancel(id); }
    public DrugPurchaseOrder getById(int id) { return dao.findById(id); }
    public List<DrugPurchaseOrder> getAll(String status) { return dao.findAll(status); }
}