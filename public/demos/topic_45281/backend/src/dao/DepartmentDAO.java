package dao;

import bean.Department;
import java.util.List;

public interface DepartmentDAO {
    int insert(Department department);
    int update(Department department);
    int delete(int id);
    Department findById(int id);
    Department findByName(String name);
    List<Department> findAll();
}
