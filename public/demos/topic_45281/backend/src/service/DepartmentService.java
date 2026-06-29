package service;

import bean.Department;
import dao.DepartmentDAO;
import dao.impl.DepartmentDAOImpl;
import java.util.List;

public class DepartmentService {
    private DepartmentDAO departmentDAO = new DepartmentDAOImpl();

    public int addDepartment(Department department) {
        return departmentDAO.insert(department);
    }

    public int updateDepartment(Department department) {
        return departmentDAO.update(department);
    }

    public int deleteDepartment(int id) {
        return departmentDAO.delete(id);
    }

    public Department getDepartmentById(int id) {
        return departmentDAO.findById(id);
    }

    public Department getDepartmentByName(String name) {
        return departmentDAO.findByName(name);
    }

    public List<Department> getAllDepartments() {
        return departmentDAO.findAll();
    }

    public boolean existsByName(String name) {
        return departmentDAO.findByName(name) != null;
    }
}
