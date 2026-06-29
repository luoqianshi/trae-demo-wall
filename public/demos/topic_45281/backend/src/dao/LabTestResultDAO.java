package dao;
import bean.LabTestResult;
import java.util.List;
public interface LabTestResultDAO {
    int insert(LabTestResult r);
    int update(LabTestResult r);
    LabTestResult findById(int id);
    List<LabTestResult> findByOrderId(int orderId);
}
