package dao;

import bean.TreatmentExecution;
import java.util.List;

public interface TreatmentExecutionDAO {
    int insert(TreatmentExecution e);
    int update(TreatmentExecution e);
    List<TreatmentExecution> findAll(Integer patientId, String status);
    int delete(int id);
    TreatmentExecution findById(int id);
}