package dao;

import bean.OrderExecution;
import java.util.List;

public interface OrderExecutionDAO {
    int insert(OrderExecution e);
    int update(OrderExecution e);
    List<OrderExecution> findAll(Integer patientId, String status);
    int delete(int id);
    OrderExecution findById(int id);
}