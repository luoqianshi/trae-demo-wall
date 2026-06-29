package dao;

import bean.TriageQueue;
import java.util.List;

public interface TriageQueueDAO {
    int insert(TriageQueue q);
    int update(TriageQueue q);
    List<TriageQueue> findAll(Integer deptId, Integer doctorId, String status);
    int delete(int id);
}