package dao;

import bean.MedicalInsuranceSettlement;
import java.util.List;

public interface MedicalInsuranceSettlementDAO {
    int insert(MedicalInsuranceSettlement s);
    List<MedicalInsuranceSettlement> findByPatient(int patientId);
    int delete(int id);
}