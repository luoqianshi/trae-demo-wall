package dao;

import bean.Patient;
import java.util.List;

public interface PatientDAO {
    int insert(Patient patient);
    int update(Patient patient);
    int delete(int id);
    Patient findById(int id);
    List<Patient> findAll();
    List<Patient> findByKeyword(String keyword);
    Patient findByIdCard(String idCard);
    Patient findByMedicalRecordNo(String medicalRecordNo);
    boolean canDelete(int id);
}
