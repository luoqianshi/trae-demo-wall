package service;

import bean.PrescriptionEnhanced;
import dao.PrescriptionEnhancedDAO;
import dao.impl.PrescriptionEnhancedDAOImpl;
import java.util.List;

public class PrescriptionEnhancedService {
    private PrescriptionEnhancedDAO dao = new PrescriptionEnhancedDAOImpl();

    public int add(PrescriptionEnhanced p) {
        if (p.getPrescriptionNo() == null || p.getPrescriptionNo().isEmpty()) {
            p.setPrescriptionNo("RX" + System.currentTimeMillis());
        }
        return dao.insert(p);
    }

    public int update(PrescriptionEnhanced p) {
        return dao.update(p);
    }

    public PrescriptionEnhanced getByPrescriptionNo(String no) {
        return dao.findByPrescriptionNo(no);
    }

    public List<PrescriptionEnhanced> getByPatientId(int patientId) {
        return dao.findPrescriptionsByPatientId(patientId);
    }

    public List<PrescriptionEnhanced> getAll(String status, int page, int size) {
        return dao.findAllPrescriptions(status, page, size);
    }
}