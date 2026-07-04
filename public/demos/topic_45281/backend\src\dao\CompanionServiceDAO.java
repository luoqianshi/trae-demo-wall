package dao;

import bean.CompanionService;
import java.util.List;

public interface CompanionServiceDAO {
    int insert(CompanionService c);
    List<CompanionService> findByCompanionPatientId(int patientId);
    List<CompanionService> findByInpatientId(int inpatientId);
    int endService(int id);
}
