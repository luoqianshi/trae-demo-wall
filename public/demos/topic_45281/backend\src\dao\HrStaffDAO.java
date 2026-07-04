package dao;
import bean.HrStaff;
import java.util.List;
public interface HrStaffDAO {
    int insert(HrStaff h);
    int update(HrStaff h);
    HrStaff findById(int id);
    List<HrStaff> findByDeptId(int deptId);
    List<HrStaff> findStaff(String workStatus, String staffType, int page, int size);
}
