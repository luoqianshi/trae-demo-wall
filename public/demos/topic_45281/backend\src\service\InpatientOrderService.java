package service;

import bean.InpatientOrder;
import dao.InpatientOrderDAO;
import dao.impl.InpatientOrderDAOImpl;
import java.util.List;

public class InpatientOrderService {
    private InpatientOrderDAO dao = new InpatientOrderDAOImpl();

    public int add(InpatientOrder o) {
        return dao.insert(o);
    }

    public int update(InpatientOrder o) {
        return dao.update(o);
    }

    public InpatientOrder getById(int id) {
        return dao.findOrderById(id);
    }

    public List<InpatientOrder> getByInpatientId(int inpatientId) {
        return dao.findByInpatientId(inpatientId);
    }

    public List<InpatientOrder> getAll(String type, String status, int page, int size) {
        return dao.findAllOrders(type, status, page, size);
    }
}