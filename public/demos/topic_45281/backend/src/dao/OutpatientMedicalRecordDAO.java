package dao;
import bean.OutpatientMedicalRecord;
import java.util.List;

public interface OutpatientMedicalRecordDAO {
    int insert(OutpatientMedicalRecord r);
    int update(OutpatientMedicalRecord r);
    OutpatientMedicalRecord findById(int id);
    List<OutpatientMedicalRecord> findByPatientId(int patientId);
    List<OutpatientMedicalRecord> findByDoctorId(int doctorId);
    List<OutpatientMedicalRecord> findAll(String status, int page, int size);
}
