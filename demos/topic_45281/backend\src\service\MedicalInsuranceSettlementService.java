package service;

import bean.MedicalInsuranceSettlement;
import dao.MedicalInsuranceSettlementDAO;
import dao.impl.MedicalInsuranceSettlementDAOImpl;
import java.util.List;

public class MedicalInsuranceSettlementService {
    private MedicalInsuranceSettlementDAO dao = new MedicalInsuranceSettlementDAOImpl();

    public int add(MedicalInsuranceSettlement s) { return dao.insert(s); }
    public List<MedicalInsuranceSettlement> getByPatient(int patientId) { return dao.findByPatient(patientId); }
    public int delete(int id) { return dao.delete(id); }
}