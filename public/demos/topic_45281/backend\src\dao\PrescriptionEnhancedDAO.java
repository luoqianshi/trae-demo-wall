package dao;
import bean.PrescriptionEnhanced;
import java.util.List;

public interface PrescriptionEnhancedDAO {
    int insert(PrescriptionEnhanced p);
    int update(PrescriptionEnhanced p);
    PrescriptionEnhanced findByPrescriptionNo(String no);
    List<PrescriptionEnhanced> findPrescriptionsByPatientId(int patientId);
    List<PrescriptionEnhanced> findAllPrescriptions(String status, int page, int size);
}
