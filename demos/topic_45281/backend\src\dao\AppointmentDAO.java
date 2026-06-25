package dao;

import bean.Appointment;
import java.util.List;

public interface AppointmentDAO {
    int insert(Appointment appointment);
    int update(Appointment appointment);
    int delete(int id);
    Appointment findById(int id);
    List<Appointment> findByPatientId(int patientId);
    List<Appointment> findByDoctorIdAndDate(int doctorId, String date);
    List<Appointment> findAll(String status, int page, int size);
    int countByStatus(String status);
}
