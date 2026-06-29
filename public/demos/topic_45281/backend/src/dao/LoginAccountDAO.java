package dao;

import bean.LoginAccount;
import java.util.List;

public interface LoginAccountDAO {
    int insert(LoginAccount account);
    int update(LoginAccount account);
    int delete(int id);
    LoginAccount findById(int id);
    LoginAccount findByLoginName(String loginName);
    List<LoginAccount> findAll();
    List<LoginAccount> findByUserType(String userType);
    int updatePassword(int id, String newPassword);
    int updateStatus(int id, String status);
    int updateFailCount(int id, int failCount);
    int updateLoginSuccess(int id, String ip);
    List<LoginAccount> findByStatus(String status);
}