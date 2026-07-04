package service;

import bean.MedicalRecordVersion;
import dao.MedicalRecordVersionDAO;
import dao.impl.MedicalRecordVersionDAOImpl;
import java.util.List;

public class MedicalRecordVersionService {
    private MedicalRecordVersionDAO medicalRecordVersionDAO = new MedicalRecordVersionDAOImpl();

    public int addMedicalRecordVersion(MedicalRecordVersion version) {
        return medicalRecordVersionDAO.insert(version);
    }

    public int updateMedicalRecordVersion(MedicalRecordVersion version) {
        return medicalRecordVersionDAO.update(version);
    }

    public int deleteMedicalRecordVersion(int id) {
        return medicalRecordVersionDAO.delete(id);
    }

    public MedicalRecordVersion getMedicalRecordVersionById(int id) {
        return medicalRecordVersionDAO.findById(id);
    }

    public List<MedicalRecordVersion> getAllMedicalRecordVersions() {
        return medicalRecordVersionDAO.findAll();
    }

    public List<MedicalRecordVersion> getMedicalRecordVersionsByRecordId(int recordId) {
        return medicalRecordVersionDAO.findByRecordId(recordId);
    }
}
