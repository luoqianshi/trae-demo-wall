package dao;

import bean.MedicalRecordVersion;
import java.util.List;

public interface MedicalRecordVersionDAO {
    int insert(MedicalRecordVersion version);
    int update(MedicalRecordVersion version);
    int delete(int id);
    MedicalRecordVersion findById(int id);
    List<MedicalRecordVersion> findAll();
    List<MedicalRecordVersion> findByRecordId(int recordId);
}
