package dao;

import bean.SysAdmin;
import java.util.List;

public interface SysAdminDAO {
    int insert(SysAdmin admin);
    int update(SysAdmin admin);
    int delete(int id);
    SysAdmin findById(int id);
    SysAdmin findByLoginAccountId(int loginAccountId);
    List<SysAdmin> findAll();
}