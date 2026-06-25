package dao.impl;

import util.JDBCUtil;
import bean.SysAdmin;
import dao.SysAdminDAO;
import java.util.ArrayList;
import java.util.List;

public class SysAdminDAOImpl implements SysAdminDAO {

    @Override
    public int insert(SysAdmin admin) {
        String sql = "INSERT INTO sys_admin(admin_name, login_account_id, department_id, phone, email) VALUES (?, ?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, admin.getAdminName(), admin.getLoginAccountId(),
                admin.getDepartmentId(), admin.getPhone(), admin.getEmail());
    }

    @Override
    public int update(SysAdmin admin) {
        String sql = "UPDATE sys_admin SET admin_name = ?, phone = ?, email = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, admin.getAdminName(), admin.getPhone(), admin.getEmail(), admin.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM sys_admin WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public SysAdmin findById(int id) {
        String sql = "SELECT * FROM sys_admin WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToAdmin(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public SysAdmin findByLoginAccountId(int loginAccountId) {
        String sql = "SELECT * FROM sys_admin WHERE login_account_id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, loginAccountId)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToAdmin(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<SysAdmin> findAll() {
        String sql = "SELECT * FROM sys_admin";
        List<SysAdmin> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToAdmin(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private SysAdmin mapToAdmin(java.sql.ResultSet rs) throws Exception {
        SysAdmin a = new SysAdmin();
        a.setId(rs.getInt("id"));
        a.setAdminName(rs.getString("admin_name"));
        a.setLoginAccountId(rs.getInt("login_account_id"));
        a.setDepartmentId(rs.getInt("department_id"));
        a.setPhone(rs.getString("phone"));
        a.setEmail(rs.getString("email"));
        a.setCreateTime(rs.getTimestamp("create_time"));
        return a;
    }
}