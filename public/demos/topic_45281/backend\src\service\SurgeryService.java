package service;

import bean.Surgery;
import dao.impl.SurgeryDAOImpl;
import dao.SurgeryDAO;
import java.util.List;

public class SurgeryService {
    private SurgeryDAO surgeryDAO = new SurgeryDAOImpl();

    public int add(Surgery surgery) {
        return surgeryDAO.insert(surgery);
    }

    public int update(Surgery surgery) {
        return surgeryDAO.update(surgery);
    }

    public int delete(int id) {
        return surgeryDAO.delete(id);
    }

    public Surgery getById(int id) {
        return surgeryDAO.findById(id);
    }

    public List<Surgery> getAll() {
        return surgeryDAO.findAll();
    }

    public List<Surgery> getByPatientId(int patientId) {
        return surgeryDAO.findByPatientId(patientId);
    }

    public List<Surgery> getByStatus(String status) {
        return surgeryDAO.findByStatus(status);
    }

    public List<Surgery> getByDept(String dept) {
        return surgeryDAO.findByDept(dept);
    }
}