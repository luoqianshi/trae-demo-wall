package service;

import bean.OutpatientMedicalRecord;
import dao.OutpatientMedicalRecordDAO;
import dao.impl.OutpatientMedicalRecordDAOImpl;
import java.util.List;

public class OutpatientMedicalRecordService {
    private OutpatientMedicalRecordDAO dao = new OutpatientMedicalRecordDAOImpl();

    public int add(OutpatientMedicalRecord r) {
        if (r.getMedicalRecordNo() == null || r.getMedicalRecordNo().isEmpty()) {
            r.setMedicalRecordNo("MR" + System.currentTimeMillis());
        }
        return dao.insert(r);
    }

    public int update(OutpatientMedicalRecord r) {
        return dao.update(r);
    }

    public OutpatientMedicalRecord getById(int id) {
        return dao.findById(id);
    }

    public List<OutpatientMedicalRecord> getByPatientId(int patientId) {
        return dao.findByPatientId(patientId);
    }

    public List<OutpatientMedicalRecord> getByDoctorId(int doctorId) {
        return dao.findByDoctorId(doctorId);
    }

    public List<OutpatientMedicalRecord> getAll(String status, int page, int size) {
        return dao.findAll(status, page, size);
    }
}