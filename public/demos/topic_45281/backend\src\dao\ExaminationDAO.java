package dao;

import bean.Examination;
import java.util.List;

public interface ExaminationDAO {
    int insert(Examination examination);
    int update(Examination examination);
    int delete(int id);
    Examination findById(int id);
    List<Examination> findAll();
    List<Examination> findByCategory(String category);
    List<Examination> findByKeyword(String keyword);
}
