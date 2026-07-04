package dao.impl;

import util.JDBCUtil;
import bean.LoginAccount;
import dao.LoginAccountDAO;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;

public class LoginAccountDAOImpl implements LoginAccountDAO {

    @Override
    public int insert(LoginAccount account) {
        String sql = "INSERT INTO sys_login_account(login_name, password, user_type, status, relate_id) VALUES (?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, account.getLoginName(), account.getPassword(),
                account.getUserType(), account.getStatus(), account.getRelateId());
    }

    @Override
    public int update(LoginAccount account) {
        String sql = "UPDATE sys_login_account SET login_name = ?, user_type = ?, status = ?, relate_id = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, account.getLoginName(), account.getUserType(),
                account.getStatus(), account.getRelateId(), account.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM sys_login_account WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public LoginAccount findById(int id) {
        String sql = "SELECT * FROM sys_login_account WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToAccount(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public LoginAccount findByLoginName(String loginName) {
        String sql = "SELECT * FROM sys_login_account WHERE login_name = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, loginName)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToAccount(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<LoginAccount> findAll() {
        String sql = "SELECT * FROM sys_login_account";
        List<LoginAccount> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToAccount(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<LoginAccount> findByUserType(String userType) {
        String sql = "SELECT * FROM sys_login_account WHERE user_type = ?";
        List<LoginAccount> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, userType)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToAccount(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public int updatePassword(int id, String newPassword) {
        String sql = "UPDATE sys_login_account SET password = ?, login_fail_count = 0, password_update_time = NOW() WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, newPassword, id);
    }

    @Override
    public int updateStatus(int id, String status) {
        String sql = "UPDATE sys_login_account SET status = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, status, id);
    }

    @Override
    public int updateFailCount(int id, int failCount) {
        String sql = "UPDATE sys_login_account SET login_fail_count = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, failCount, id);
    }

    @Override
    public int updateLoginSuccess(int id, String ip) {
        String sql = "UPDATE sys_login_account SET last_login_time = NOW(), last_login_ip = ?, login_fail_count = 0 WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, ip, id);
    }

    @Override
    public List<LoginAccount> findByStatus(String status) {
        String sql = "SELECT * FROM sys_login_account WHERE status = ?";
        List<LoginAccount> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, status)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToAccount(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private LoginAccount mapToAccount(java.sql.ResultSet rs) throws Exception {
        LoginAccount a = new LoginAccount();
        a.setId(rs.getInt("id"));
        a.setLoginName(rs.getString("login_name"));
        a.setPassword(rs.getString("password"));
        a.setUserType(rs.getString("user_type"));
        a.setStatus(rs.getString("status"));
        Object relateIdObj = rs.getObject("relate_id");
        if (relateIdObj != null) a.setRelateId(((Number) relateIdObj).intValue());
        Timestamp lastLogin = rs.getTimestamp("last_login_time");
        if (lastLogin != null) a.setLastLoginTime(lastLogin);
        a.setLastLoginIp(rs.getString("last_login_ip"));
        a.setLoginFailCount(rs.getInt("login_fail_count"));
        Timestamp pwdUpdate = rs.getTimestamp("password_update_time");
        if (pwdUpdate != null) a.setPasswordUpdateTime(pwdUpdate);
        a.setCreateTime(rs.getTimestamp("create_time"));
        a.setUpdateTime(rs.getTimestamp("update_time"));
        return a;
    }
}