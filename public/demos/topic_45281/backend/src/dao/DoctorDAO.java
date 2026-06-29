package dao;

import bean.Doctor;
import java.util.List;

public interface DoctorDAO {
    int insert(Doctor doctor);
    int update(Doctor doctor);
    int delete(int id);
    Doctor findById(int id);
    List<Doctor> findAll();
    List<Doctor> findByDept(String dept);
    List<Doctor> findByKeyword(String keyword);
    Doctor findByWorkNo(String workNo);
}
