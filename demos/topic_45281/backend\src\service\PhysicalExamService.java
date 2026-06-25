package service;

import bean.PhysicalExam;
import dao.impl.PhysicalExamDAOImpl;
import dao.PhysicalExamDAO;
import java.util.List;

public class PhysicalExamService {
    private PhysicalExamDAO physicalExamDAO = new PhysicalExamDAOImpl();

    public int add(PhysicalExam exam) {
        return physicalExamDAO.insert(exam);
    }

    public int update(PhysicalExam exam) {
        return physicalExamDAO.update(exam);
    }

    public int delete(int id) {
        return physicalExamDAO.delete(id);
    }

    public PhysicalExam getById(int id) {
        return physicalExamDAO.findById(id);
    }

    public List<PhysicalExam> getAll() {
        return physicalExamDAO.findAll();
    }

    public List<PhysicalExam> getByPatientId(int patientId) {
        return physicalExamDAO.findByPatientId(patientId);
    }

    public List<PhysicalExam> getByStatus(String status) {
        return physicalExamDAO.findByStatus(status);
    }
}