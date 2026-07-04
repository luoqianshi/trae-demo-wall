package dao;
import bean.InpatientOrder;
import java.util.List;

public interface InpatientOrderDAO {
    int insert(InpatientOrder o);
    int update(InpatientOrder o);
    InpatientOrder findOrderById(int id);
    List<InpatientOrder> findByInpatientId(int inpatientId);
    List<InpatientOrder> findAllOrders(String type, String status, int page, int size);
}
