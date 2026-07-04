package service;

import bean.LoginAccount;
import bean.LoginLog;
import dao.LoginAccountDAO;
import dao.LoginLogDAO;
import dao.impl.LoginAccountDAOImpl;
import dao.impl.LoginLogDAOImpl;
import org.mindrot.jbcrypt.BCrypt;

public class AuthService {

    private LoginAccountDAO accountDAO = new LoginAccountDAOImpl();
    private LoginLogDAO logDAO = new LoginLogDAOImpl();

    private static final int MAX_FAIL_COUNT = 5;
    private static final String DEFAULT_PASSWORD = "123456";

    public AuthResult login(String loginName, String password, String ip) {
        LoginAccount account = accountDAO.findByLoginName(loginName);
        if (account == null) {
            recordLoginLog(null, loginName, null, ip, "FAIL", "ACCOUNT_NOT_FOUND", null);
            return AuthResult.fail("账号不存在");
        }

        if ("LOCKED".equals(account.getStatus())) {
            recordLoginLog(account, loginName, account.getUserType(), ip, "FAIL", "ACCOUNT_LOCKED", null);
            return AuthResult.fail("账号已被锁定，请联系信息科管理员");
        }
        if ("DISABLED".equals(account.getStatus())) {
            recordLoginLog(account, loginName, account.getUserType(), ip, "FAIL", "ACCOUNT_DISABLED", null);
            return AuthResult.fail("账号已被禁用");
        }

        if (!verifyPassword(password, account.getPassword())) {
            int newFailCount = account.getLoginFailCount() + 1;
            accountDAO.updateFailCount(account.getId(), newFailCount);
            if (newFailCount >= MAX_FAIL_COUNT) {
                accountDAO.updateStatus(account.getId(), "LOCKED");
                recordLoginLog(account, loginName, account.getUserType(), ip, "FAIL", "ACCOUNT_LOCKED_MAX_RETRY", null);
                return AuthResult.fail("密码错误次数过多，账号已锁定");
            }
            recordLoginLog(account, loginName, account.getUserType(), ip, "FAIL", "WRONG_PASSWORD", null);
            return AuthResult.fail("密码错误，还剩" + (MAX_FAIL_COUNT - newFailCount) + "次尝试机会");
        }

        accountDAO.updateLoginSuccess(account.getId(), ip);
        account = accountDAO.findById(account.getId());
        recordLoginLog(account, loginName, account.getUserType(), ip, "SUCCESS", null, null);

        return AuthResult.success(account);
    }

    public int createAccount(String loginName, String userType, Integer relateId) {
        LoginAccount account = new LoginAccount();
        account.setLoginName(loginName);
        account.setPassword(BCrypt.hashpw(DEFAULT_PASSWORD, BCrypt.gensalt(12)));
        account.setUserType(userType);
        account.setStatus("ACTIVE");
        account.setRelateId(relateId);
        return accountDAO.insert(account);
    }

    public boolean resetPassword(int accountId) {
        String newHash = BCrypt.hashpw(DEFAULT_PASSWORD, BCrypt.gensalt(12));
        accountDAO.updateStatus(accountId, "ACTIVE");
        return accountDAO.updatePassword(accountId, newHash) > 0;
    }

    public boolean unlockAccount(int accountId) {
        accountDAO.updateFailCount(accountId, 0);
        return accountDAO.updateStatus(accountId, "ACTIVE") > 0;
    }

    public LoginAccount getAccountById(int id) {
        return accountDAO.findById(id);
    }

    public LoginAccount getAccountByLoginName(String loginName) {
        return accountDAO.findByLoginName(loginName);
    }

    public java.util.List<LoginAccount> getAllAccounts() {
        return accountDAO.findAll();
    }

    public java.util.List<LoginAccount> getAccountsByType(String userType) {
        return accountDAO.findByUserType(userType);
    }

    public java.util.List<LoginAccount> getAccountsByStatus(String status) {
        return accountDAO.findByStatus(status);
    }

    public java.util.List<LoginLog> getLoginLogs(int offset, int limit) {
        return logDAO.findAll(offset, limit);
    }

    public java.util.List<LoginLog> getLoginLogsByAccount(int accountId) {
        return logDAO.findByAccountId(accountId);
    }

    public int getLoginLogCount() {
        return logDAO.count();
    }

    private boolean verifyPassword(String plain, String stored) {
        if (stored == null) return false;
        if (stored.startsWith("$2a$")) {
            try {
                return BCrypt.checkpw(plain, stored);
            } catch (Exception e) {
                return false;
            }
        }
        return plain.equals(stored);
    }

    private void recordLoginLog(LoginAccount account, String loginName, String userType,
                                 String ip, String result, String failReason, String userAgent) {
        LoginLog log = new LoginLog();
        log.setAccountId(account != null ? account.getId() : null);
        log.setLoginName(loginName);
        log.setUserType(userType != null ? userType : "UNKNOWN");
        log.setLoginIp(ip);
        log.setLoginResult(result);
        log.setFailReason(failReason);
        log.setUserAgent(userAgent);
        logDAO.insert(log);
    }

    public static class AuthResult {
        private boolean success;
        private LoginAccount account;
        private String errorMessage;

        private AuthResult(boolean success, LoginAccount account, String errorMessage) {
            this.success = success;
            this.account = account;
            this.errorMessage = errorMessage;
        }

        public static AuthResult success(LoginAccount account) {
            return new AuthResult(true, account, null);
        }

        public static AuthResult fail(String errorMessage) {
            return new AuthResult(false, null, errorMessage);
        }

        public boolean isSuccess() { return success; }
        public LoginAccount getAccount() { return account; }
        public String getErrorMessage() { return errorMessage; }
    }
}