package dao;

import bean.MedicalRecord;
import java.util.List;

public interface MedicalRecordDAO {
    int insert(MedicalRecord record);
    int update(MedicalRecord record);
    int delete(int id);
    MedicalRecord findById(int id);
    List<MedicalRecord> findAll();
    List<MedicalRecord> findByPatientId(int patientId);
    List<MedicalRecord> findByDoctorId(int doctorId);
}
