package dao;

import bean.QueueDisplay;
import java.util.List;

public interface QueueDisplayDAO {
    int insertOrReplace(QueueDisplay q);
    List<QueueDisplay> findByDept(Integer deptId);
    int delete(int id);
}