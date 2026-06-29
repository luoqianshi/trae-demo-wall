package dao;

import bean.Surgery;
import java.util.List;

public interface SurgeryDAO {
    int insert(Surgery surgery);
    int update(Surgery surgery);
    int delete(int id);
    Surgery findById(int id);
    List<Surgery> findAll();
    List<Surgery> findByPatientId(int patientId);
    List<Surgery> findByStatus(String status);
    List<Surgery> findByDept(String dept);
}