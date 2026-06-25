package dao;
import bean.BedManagement;
import java.util.List;
public interface BedManagementDAO {
    int insert(BedManagement b);
    int update(BedManagement b);
    BedManagement findById(int id);
    List<BedManagement> findByDeptId(int deptId);
    List<BedManagement> findBeds(String bedStatus, String bedType, int page, int size);
}
