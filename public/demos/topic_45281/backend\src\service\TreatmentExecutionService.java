package service;

import bean.TreatmentExecution;
import dao.TreatmentExecutionDAO;
import dao.impl.TreatmentExecutionDAOImpl;
import java.util.List;

public class TreatmentExecutionService {
    private TreatmentExecutionDAO dao = new TreatmentExecutionDAOImpl();

    public int add(TreatmentExecution e) { return dao.insert(e); }
    public int update(TreatmentExecution e) { return dao.update(e); }
    public TreatmentExecution getById(int id) { return dao.findById(id); }
    public List<TreatmentExecution> getAll(Integer patientId, String status) { return dao.findAll(patientId, status); }
    public int delete(int id) { return dao.delete(id); }
}