package service;

import bean.Examination;
import dao.ExaminationDAO;
import dao.impl.ExaminationDAOImpl;
import java.util.List;

public class ExaminationService {
    private ExaminationDAO examinationDAO = new ExaminationDAOImpl();

    public int addExamination(Examination examination) {
        return examinationDAO.insert(examination);
    }

    public int updateExamination(Examination examination) {
        return examinationDAO.update(examination);
    }

    public int deleteExamination(int id) {
        return examinationDAO.delete(id);
    }

    public Examination getExaminationById(int id) {
        return examinationDAO.findById(id);
    }

    public List<Examination> getAllExaminations() {
        return examinationDAO.findAll();
    }

    public List<Examination> getExaminationsByCategory(String category) {
        return examinationDAO.findByCategory(category);
    }

    public List<Examination> searchExaminations(String keyword) {
        return examinationDAO.findByKeyword(keyword);
    }
}
