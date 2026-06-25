package service;

import bean.MedicalRecord;
import dao.MedicalRecordDAO;
import dao.impl.MedicalRecordDAOImpl;
import java.util.Date;
import java.util.List;

public class MedicalRecordService {
    private MedicalRecordDAO medicalRecordDAO = new MedicalRecordDAOImpl();

    public int addRecord(MedicalRecord record) {
        record.setCreateTime(new Date());
        return medicalRecordDAO.insert(record);
    }

    public int updateRecord(MedicalRecord record) {
        return medicalRecordDAO.update(record);
    }

    public int deleteRecord(int id) {
        return medicalRecordDAO.delete(id);
    }

    public MedicalRecord getRecordById(int id) {
        return medicalRecordDAO.findById(id);
    }

    public List<MedicalRecord> getAllRecords() {
        return medicalRecordDAO.findAll();
    }

    public List<MedicalRecord> getRecordsByPatientId(int patientId) {
        return medicalRecordDAO.findByPatientId(patientId);
    }

    public List<MedicalRecord> getRecordsByDoctorId(int doctorId) {
        return medicalRecordDAO.findByDoctorId(doctorId);
    }
}
