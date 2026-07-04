package dao;

import bean.MedicalRecordArchive;
import java.util.List;

public interface MedicalRecordArchiveDAO {
    int insert(MedicalRecordArchive archive);
    int update(MedicalRecordArchive archive);
    int delete(int id);
    MedicalRecordArchive findById(int id);
    List<MedicalRecordArchive> findAll();
    List<MedicalRecordArchive> findByStatus(String status);
}