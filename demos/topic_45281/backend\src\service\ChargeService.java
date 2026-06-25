package service;

import bean.Charge;
import dao.ChargeDAO;
import dao.impl.ChargeDAOImpl;
import java.util.Date;
import java.util.List;

public class ChargeService {
    private ChargeDAO chargeDAO = new ChargeDAOImpl();

    public int charge(Charge charge) {
        charge.setChargeTime(new Date());
        return chargeDAO.insert(charge);
    }

    public int updateCharge(Charge charge) {
        return chargeDAO.update(charge);
    }

    public int deleteCharge(int id) {
        return chargeDAO.delete(id);
    }

    public Charge getChargeById(int id) {
        return chargeDAO.findById(id);
    }

    public List<Charge> getAllCharges() {
        return chargeDAO.findAll();
    }

    public List<Charge> getChargesByPrescriptionId(int prescriptionId) {
        return chargeDAO.findByPrescriptionId(prescriptionId);
    }

    public List<Charge> getChargesByPatientId(int patientId) {
        return chargeDAO.findByPatientId(patientId);
    }
}
