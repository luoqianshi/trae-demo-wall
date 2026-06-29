package dao;
import bean.BloodTransfusionOrder;
import java.util.List;
public interface BloodTransfusionOrderDAO {
    int insert(BloodTransfusionOrder o);
    int update(BloodTransfusionOrder o);
    BloodTransfusionOrder findById(int id);
    List<BloodTransfusionOrder> findTransfusionsByPatientId(int patientId);
    List<BloodTransfusionOrder> findTransfusions(String status, int page, int size);
}
