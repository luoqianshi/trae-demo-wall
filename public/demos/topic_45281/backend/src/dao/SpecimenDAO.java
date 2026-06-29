package dao;

import bean.Specimen;
import java.util.List;

public interface SpecimenDAO {
    int insert(Specimen s);
    int update(Specimen s);
    List<Specimen> findAll(Integer patientId, String status);
    int delete(int id);
    Specimen findById(int id);
}