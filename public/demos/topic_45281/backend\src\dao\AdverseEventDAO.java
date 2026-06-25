package dao;
import bean.AdverseEvent;
import java.util.List;
public interface AdverseEventDAO {
    int insert(AdverseEvent e);
    int update(AdverseEvent e);
    AdverseEvent findById(int id);
    List<AdverseEvent> findByDeptId(int deptId);
    List<AdverseEvent> findEvents(String eventType, String status, int page, int size);
}
