package service;

import bean.VitalSign;
import dao.impl.VitalSignDAOImpl;
import dao.VitalSignDAO;
import java.util.List;

public class VitalSignService {
    private VitalSignDAO vitalSignDAO = new VitalSignDAOImpl();

    public int add(VitalSign vitalSign) {
        return vitalSignDAO.insert(vitalSign);
    }

    public int update(VitalSign vitalSign) {
        return vitalSignDAO.update(vitalSign);
    }

    public int delete(int id) {
        return vitalSignDAO.delete(id);
    }

    public VitalSign getById(int id) {
        return vitalSignDAO.findById(id);
    }

    public List<VitalSign> getAll() {
        return vitalSignDAO.findAll();
    }

    public List<VitalSign> getByInpatientId(int inpatientId) {
        return vitalSignDAO.findByInpatientId(inpatientId);
    }

    public VitalSign getLatestByInpatientId(int inpatientId) {
        return vitalSignDAO.findLatestByInpatientId(inpatientId);
    }
}