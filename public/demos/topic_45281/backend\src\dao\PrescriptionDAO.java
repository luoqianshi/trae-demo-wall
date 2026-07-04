package dao;

import bean.Prescription;
import java.util.List;

public interface PrescriptionDAO {
    int insert(Prescription prescription);
    int update(Prescription prescription);
    int delete(int id);
    Prescription findById(int id);
    List<Prescription> findAll();
    List<Prescription> findByPatientId(int patientId);
    List<Prescription> findByDoctorId(int doctorId);
    List<Prescription> findByStatus(String status);
}
