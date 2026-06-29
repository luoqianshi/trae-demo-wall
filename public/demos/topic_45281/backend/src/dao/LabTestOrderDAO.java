package dao;
import bean.LabTestOrder;
import java.util.List;
public interface LabTestOrderDAO {
    int insert(LabTestOrder o);
    int update(LabTestOrder o);
    LabTestOrder findById(int id);
    List<LabTestOrder> findOrdersByPatientId(int patientId);
    List<LabTestOrder> findOrders(String status, int page, int size);
}
