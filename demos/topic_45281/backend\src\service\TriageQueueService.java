package service;

import bean.TriageQueue;
import dao.TriageQueueDAO;
import dao.impl.TriageQueueDAOImpl;
import java.util.List;

public class TriageQueueService {
    private TriageQueueDAO dao = new TriageQueueDAOImpl();

    public int add(TriageQueue q) { return dao.insert(q); }
    public int update(TriageQueue q) { return dao.update(q); }
    public List<TriageQueue> getAll(Integer deptId, Integer doctorId, String status) { return dao.findAll(deptId, doctorId, status); }
    public int delete(int id) { return dao.delete(id); }
}