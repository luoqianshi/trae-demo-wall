package service;

import bean.MedicalRecordArchive;
import dao.impl.MedicalRecordArchiveDAOImpl;
import dao.MedicalRecordArchiveDAO;
import java.util.List;

public class MedicalRecordArchiveService {
    private MedicalRecordArchiveDAO archiveDAO = new MedicalRecordArchiveDAOImpl();

    public int add(MedicalRecordArchive archive) {
        return archiveDAO.insert(archive);
    }

    public int update(MedicalRecordArchive archive) {
        return archiveDAO.update(archive);
    }

    public int delete(int id) {
        return archiveDAO.delete(id);
    }

    public MedicalRecordArchive getById(int id) {
        return archiveDAO.findById(id);
    }

    public List<MedicalRecordArchive> getAll() {
        return archiveDAO.findAll();
    }

    public List<MedicalRecordArchive> getByStatus(String status) {
        return archiveDAO.findByStatus(status);
    }
}