package dao;

import bean.PatientLocation;
import java.util.List;

public interface PatientLocationDAO {
    int insert(PatientLocation l);
    List<PatientLocation> findByLocPatientId(int patientId);
    int checkOut(int id);
}
