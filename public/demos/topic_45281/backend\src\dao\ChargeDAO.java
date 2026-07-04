package dao;

import bean.Charge;
import java.util.List;

public interface ChargeDAO {
    int insert(Charge charge);
    int update(Charge charge);
    int delete(int id);
    Charge findById(int id);
    List<Charge> findAll();
    List<Charge> findByPrescriptionId(int prescriptionId);
    List<Charge> findByPatientId(int patientId);
}
