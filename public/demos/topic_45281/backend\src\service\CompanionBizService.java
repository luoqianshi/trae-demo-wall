package service;

import bean.CompanionService;
import dao.impl.CompanionServiceDAOImpl;
import java.util.List;

public class CompanionBizService {
    private CompanionServiceDAOImpl dao = new CompanionServiceDAOImpl();

    public int add(CompanionService c) {
        return dao.insert(c);
    }

    public List<CompanionService> getByPatientId(int patientId) {
        return dao.findByCompanionPatientId(patientId);
    }

    public List<CompanionService> getByInpatientId(int inpatientId) {
        return dao.findByInpatientId(inpatientId);
    }

    public int endService(int id) {
        return dao.endService(id);
    }
}