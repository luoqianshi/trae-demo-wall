package dao;
import bean.PathologyExamOrder;
import java.util.List;
public interface PathologyExamOrderDAO {
    int insert(PathologyExamOrder o);
    int update(PathologyExamOrder o);
    PathologyExamOrder findById(int id);
    List<PathologyExamOrder> findPathologyByPatientId(int patientId);
    List<PathologyExamOrder> findPathologies(String status, int page, int size);
}
