package dao;
import bean.FinanceCharge;
import java.util.List;
public interface FinanceChargeDAO {
    int insert(FinanceCharge f);
    int update(FinanceCharge f);
    FinanceCharge findById(int id);
    List<FinanceCharge> findByPatientId(int patientId);
    List<FinanceCharge> findCharges(String chargeType, String status, int page, int size);
}
