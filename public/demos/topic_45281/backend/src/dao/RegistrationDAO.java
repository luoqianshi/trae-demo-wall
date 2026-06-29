package dao;

import bean.Registration;
import java.util.List;

public interface RegistrationDAO {
    int insert(Registration registration);
    int update(Registration registration);
    int delete(int id);
    Registration findById(int id);
    List<Registration> findAll();
    List<Registration> findByPatientId(int patientId);
    List<Registration> findByDoctorId(int doctorId);
    List<Registration> findByDept(String dept);
    int countByDept(String dept);
    List<Registration> findByStatus(String status);
}
