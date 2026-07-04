package service;

import bean.OrderExecution;
import dao.OrderExecutionDAO;
import dao.impl.OrderExecutionDAOImpl;
import java.util.List;

public class OrderExecutionService {
    private OrderExecutionDAO dao = new OrderExecutionDAOImpl();

    public int add(OrderExecution e) { return dao.insert(e); }
    public int update(OrderExecution e) { return dao.update(e); }
    public OrderExecution getById(int id) { return dao.findById(id); }
    public List<OrderExecution> getAll(Integer patientId, String status) { return dao.findAll(patientId, status); }
    public int delete(int id) { return dao.delete(id); }
}