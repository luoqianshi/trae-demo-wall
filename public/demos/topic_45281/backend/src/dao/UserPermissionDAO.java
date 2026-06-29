package dao;
import bean.UserPermission;
import java.util.List;
public interface UserPermissionDAO {
    int insert(UserPermission p);
    int update(UserPermission p);
    UserPermission findById(int id);
    List<UserPermission> findByUserId(int userId);
    List<UserPermission> findPermissions(String moduleCode, String status, int page, int size);
}
