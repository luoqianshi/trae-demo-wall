package dao;

import bean.LoginLog;
import java.util.List;

public interface LoginLogDAO {
    int insert(LoginLog log);
    int updateLogout(long id, java.util.Date logoutTime, long sessionDuration);
    LoginLog findById(long id);
    List<LoginLog> findByAccountId(int accountId);
    List<LoginLog> findAll(int offset, int limit);
    List<LoginLog> findByLoginName(String loginName);
    List<LoginLog> findByDateRange(java.util.Date start, java.util.Date end);
    List<LoginLog> findByResult(String result);
    int count();
}