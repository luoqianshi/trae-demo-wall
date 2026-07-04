package service;

import bean.Consultation;
import dao.ConsultationDAO;
import dao.impl.ConsultationDAOImpl;
import java.util.List;

public class ConsultationService {
    private ConsultationDAO dao = new ConsultationDAOImpl();

    public int add(Consultation c) {
        return dao.insert(c);
    }

    public Consultation getById(int id) {
        return dao.findConsultById(id);
    }

    public List<Consultation> getByDoctorId(int doctorId) {
        return dao.findByConsultDoctorId(doctorId);
    }

    public List<Consultation> getByPatientId(int patientId) {
        return dao.findByConsultPatientId(patientId);
    }

    public int updateStatus(int id, String status) {
        return dao.updateStatus(id, status);
    }
}