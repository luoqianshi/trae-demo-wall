package dao;
import bean.QualityControlCheck;
import java.util.List;
public interface QualityControlCheckDAO {
    int insert(QualityControlCheck c);
    int update(QualityControlCheck c);
    QualityControlCheck findById(int id);
    List<QualityControlCheck> findByDeptId(int deptId);
    List<QualityControlCheck> findChecks(String checkType, String status, int page, int size);
}
