package dao;

import bean.Inpatient;
import java.util.List;

public interface InpatientDAO {
    int insert(Inpatient inpatient);
    int update(Inpatient inpatient);
    int delete(int id);
    Inpatient findById(int id);
    List<Inpatient> findAll();
    List<Inpatient> findByPatientId(int patientId);
    List<Inpatient> findByDept(String dept);
    List<Inpatient> findByStatus(String status);
}