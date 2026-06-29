package dao.impl;

import util.JDBCUtil;
import bean.User;
import dao.UserDAO;
import java.util.ArrayList;
import java.util.List;

public class UserDAOImpl implements UserDAO {
    @Override
    public int insert(User user) {
        String sql = "INSERT INTO user(username, password, role, relate_id) VALUES (?, ?, ?, ?)";
        return JDBCUtil.executeInsert(sql, user.getUsername(), user.getPassword(), user.getRole(), user.getRelateId());
    }

    @Override
    public int update(User user) {
        String sql = "UPDATE user SET username = ?, password = ?, role = ?, relate_id = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, user.getUsername(), user.getPassword(), user.getRole(), user.getRelateId(), user.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM user WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public User findById(int id) {
        String sql = "SELECT * FROM user WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToUser(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public User findByUsername(String username) {
        String sql = "SELECT * FROM user WHERE username = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, username)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToUser(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<User> findAll() {
        String sql = "SELECT * FROM user ORDER BY create_time DESC";
        List<User> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToUser(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    @Override
    public List<User> findByRole(String role) {
        String sql = "SELECT * FROM user WHERE role = ? ORDER BY create_time DESC";
        List<User> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, role)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToUser(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private User mapToUser(java.sql.ResultSet rs) throws Exception {
        User user = new User();
        user.setId(rs.getInt("id"));
        user.setUsername(rs.getString("username"));
        user.setPassword(rs.getString("password"));
        user.setRole(rs.getString("role"));
        user.setRelateId(rs.getObject("relate_id") != null ? rs.getInt("relate_id") : null);
        user.setCreateTime(rs.getTimestamp("create_time"));
        return user;
    }
}
