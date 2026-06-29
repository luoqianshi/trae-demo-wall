package dao;

import bean.Consultation;
import java.util.List;

public interface ConsultationDAO {
    int insert(Consultation c);
    Consultation findConsultById(int id);
    List<Consultation> findByConsultDoctorId(int doctorId);
    List<Consultation> findByConsultPatientId(int patientId);
    int updateStatus(int id, String status);
}
