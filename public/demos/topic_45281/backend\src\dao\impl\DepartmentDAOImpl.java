package dao.impl;

import util.JDBCUtil;
import bean.Department;
import dao.DepartmentDAO;
import java.util.ArrayList;
import java.util.List;

public class DepartmentDAOImpl implements DepartmentDAO {
    @Override
    public int insert(Department department) {
        String sql = "INSERT INTO department(name, description) VALUES (?, ?)";
        return JDBCUtil.executeInsert(sql, department.getName(), department.getDescription());
    }

    @Override
    public int update(Department department) {
        String sql = "UPDATE department SET name = ?, description = ? WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, department.getName(), department.getDescription(), department.getId());
    }

    @Override
    public int delete(int id) {
        String sql = "DELETE FROM department WHERE id = ?";
        return JDBCUtil.executeUpdate(sql, id);
    }

    @Override
    public Department findById(int id) {
        String sql = "SELECT * FROM department WHERE id = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, id)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToDepartment(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public Department findByName(String name) {
        String sql = "SELECT * FROM department WHERE name = ?";
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql, name)) {
            if (qr != null && qr.getResultSet().next()) {
                return mapToDepartment(qr.getResultSet());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    @Override
    public List<Department> findAll() {
        String sql = "SELECT * FROM department ORDER BY id";
        List<Department> list = new ArrayList<>();
        try (JDBCUtil.QueryResult qr = JDBCUtil.executeQuery(sql)) {
            if (qr != null) {
                while (qr.getResultSet().next()) {
                    list.add(mapToDepartment(qr.getResultSet()));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    private Department mapToDepartment(java.sql.ResultSet rs) throws Exception {
        Department department = new Department();
        department.setId(rs.getInt("id"));
        department.setName(rs.getString("name"));
        department.setDescription(rs.getString("description"));
        department.setCreateTime(rs.getTimestamp("create_time"));
        return department;
    }
}
