package dao;

import bean.QueueCall;
import java.util.List;

public interface QueueCallDAO {
    int insert(QueueCall queue);
    int update(QueueCall queue);
    int delete(int id);
    QueueCall findById(int id);
    QueueCall findByRegistrationId(int registrationId);
    List<QueueCall> findAll();
    List<QueueCall> findByDoctorId(int doctorId);
    List<QueueCall> findByDeptAndDoctorId(String dept, int doctorId);
    List<QueueCall> findByCallStatus(String callStatus);
    List<QueueCall> findByDept(String dept);
}
