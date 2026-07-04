package service;

import bean.DrugTransferOrder;
import dao.DrugTransferOrderDAO;
import dao.impl.DrugTransferOrderDAOImpl;
import java.util.List;

public class DrugTransferOrderService {
    private DrugTransferOrderDAO dao = new DrugTransferOrderDAOImpl();

    public int add(DrugTransferOrder o) { return dao.insert(o); }
    public int update(DrugTransferOrder o) { return dao.update(o); }
    public int cancel(int id) { return dao.cancel(id); }
    public DrugTransferOrder getById(int id) { return dao.findById(id); }
    public List<DrugTransferOrder> getAll(String status) { return dao.findAll(status); }
}