package service;

import bean.QueueCall;
import dao.QueueCallDAO;
import dao.impl.QueueCallDAOImpl;
import java.util.List;

public class QueueCallService {
    private QueueCallDAO queueCallDAO = new QueueCallDAOImpl();

    public int addQueueCall(QueueCall queue) {
        return queueCallDAO.insert(queue);
    }

    public int updateQueueCall(QueueCall queue) {
        return queueCallDAO.update(queue);
    }

    public int deleteQueueCall(int id) {
        return queueCallDAO.delete(id);
    }

    public QueueCall getQueueCallById(int id) {
        return queueCallDAO.findById(id);
    }

    public QueueCall getQueueCallByRegistrationId(int registrationId) {
        return queueCallDAO.findByRegistrationId(registrationId);
    }

    public List<QueueCall> getAllQueueCalls() {
        return queueCallDAO.findAll();
    }

    public List<QueueCall> getQueueCallsByDoctorId(int doctorId) {
        return queueCallDAO.findByDoctorId(doctorId);
    }

    public List<QueueCall> getQueueCallsByDeptAndDoctorId(String dept, int doctorId) {
        return queueCallDAO.findByDeptAndDoctorId(dept, doctorId);
    }

    public List<QueueCall> getQueueCallsByCallStatus(String callStatus) {
        return queueCallDAO.findByCallStatus(callStatus);
    }

    public List<QueueCall> getQueueCallsByDept(String dept) {
        return queueCallDAO.findByDept(dept);
    }
}
