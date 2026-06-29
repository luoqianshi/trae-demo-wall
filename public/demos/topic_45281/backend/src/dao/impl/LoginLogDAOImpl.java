package dao.impl;

import util.JDBCUtil;
import bean.LoginLog;
import dao.LoginLogDAO;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

public class LoginLogDAOImpl implements LoginLogDAO {

    @Override
    public int insert(LoginLog log) {
        String sql = "INSERT INTO sys_login_log(account_id, login_name, user_type, login_ip, login_result, fail_reason, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)";
        return (int) JDBCUtil.executeInsert(sql, log.getAccountId(), log.getLoginName(),
                log.getUserType(), log.getLoginIp(), log.getLoginResult(),
                log.getFailReason(), log.getUserAgent());
    }

    @Override
    public int updateLogout(long id, Date logoutTime, long sessionDuration) {
        String sql = "UPDATE sys_login_log SET logout_time = ?, session_duration = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, new Timestamp(logoutTime.getTime()), sessionDuration, id);
    }

    @Override
    public LoginLog findById(long id) {
        String sql = "SELECT * FROM sys_login_log WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToLog(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<LoginLog> findByAccountId(int accountId) {
        String sql = "SELECT * FROM sys_login_log WHERE account_id = ? ORDER BY login_time DESC";
        List<LoginLog> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, accountId)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToLog(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<LoginLog> findAll(int offset, int limit) {
        String sql = "SELECT * FROM sys_login_log ORDER BY login_time DESC LIMIT ? OFFSET ?";
        List<LoginLog> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, limit, offset)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToLog(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<LoginLog> findByLoginName(String loginName) {
        String sql = "SELECT * FROM sys_login_log WHERE login_name = ? ORDER BY login_time DESC";
        List<LoginLog> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, loginName)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToLog(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<LoginLog> findByDateRange(Date start, Date end) {
        String sql = "SELECT * FROM sys_login_log WHERE login_time BETWEEN ? AND ? ORDER BY login_time DESC";
        List<LoginLog> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, new Timestamp(start.getTime()), new Timestamp(end.getTime()))) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToLog(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<LoginLog> findByResult(String result) {
        String sql = "SELECT * FROM sys_login_log WHERE login_result = ? ORDER BY login_time DESC";
        List<LoginLog> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, result)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToLog(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public int count() {
        String sql = "SELECT COUNT(*) FROM sys_login_log";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null && qr.getResultSet().next()) {
                return qr.getResultSet().getInt(1);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
    }

    private LoginLog mapToLog(java.sql.ResultSet rs) throws Exception {
        LoginLog log = new LoginLog();
        log.setId(rs.getLong("id"));
        Object aid = rs.getObject("account_id");
        if (aid != null) log.setAccountId(((Number) aid).intValue());
        log.setLoginName(rs.getString("login_name"));
        log.setUserType(rs.getString("user_type"));
        log.setLoginTime(rs.getTimestamp("login_time"));
        log.setLoginIp(rs.getString("login_ip"));
        log.setLoginResult(rs.getString("login_result"));
        log.setFailReason(rs.getString("fail_reason"));
        Timestamp logout = rs.getTimestamp("logout_time");
        if (logout != null) log.setLogoutTime(logout);
        Object duration = rs.getObject("session_duration");
        if (duration != null) log.setSessionDuration(((Number) duration).longValue());
        log.setUserAgent(rs.getString("user_agent"));
        return log;
    }
}