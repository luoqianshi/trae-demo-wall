package service;

import bean.Prescription;
import bean.PrescriptionItem;
import dao.PrescriptionDAO;
import dao.PrescriptionItemDAO;
import dao.impl.PrescriptionDAOImpl;
import dao.impl.PrescriptionItemDAOImpl;
import java.math.BigDecimal;
import java.util.*;

public class PrescriptionService {
    private PrescriptionDAO prescriptionDAO = new PrescriptionDAOImpl();
    private PrescriptionItemDAO prescriptionItemDAO = new PrescriptionItemDAOImpl();
    private DrugService drugService = new DrugService();

    private static final Map<String, Set<String>> VALID_TRANSITIONS = new HashMap<>();

    static {
        Set<String> fromPending = new HashSet<>(Arrays.asList("已审核", "审核退回", "作废"));
        Set<String> fromApproved = new HashSet<>(Arrays.asList("待发药", "作废"));
        Set<String> fromDispensing = new HashSet<>(Arrays.asList("已发药", "作废"));
        Set<String> fromDispensed = new HashSet<>(Arrays.asList("已退费", "作废"));
        Set<String> fromRejected = new HashSet<>(Arrays.asList("待审核", "作废"));
        Set<String> fromRefunded = new HashSet<>(Arrays.asList("作废"));

        VALID_TRANSITIONS.put("待审核", fromPending);
        VALID_TRANSITIONS.put("已审核", fromApproved);
        VALID_TRANSITIONS.put("待发药", fromDispensing);
        VALID_TRANSITIONS.put("已发药", fromDispensed);
        VALID_TRANSITIONS.put("审核退回", fromRejected);
        VALID_TRANSITIONS.put("已退费", fromRefunded);
    }

    public int addPrescription(Prescription prescription) {
        prescription.setCreateTime(new Date());
        if (prescription.getStatus() == null) prescription.setStatus("待审核");
        return prescriptionDAO.insert(prescription);
    }

    public int addPrescription(Prescription prescription, List<PrescriptionItem> items) {
        prescription.setCreateTime(new Date());
        if (prescription.getStatus() == null) prescription.setStatus("待审核");
        int prescriptionId = prescriptionDAO.insert(prescription);
        if (prescriptionId > 0) {
            for (PrescriptionItem item : items) {
                item.setPrescriptionId(prescriptionId);
                prescriptionItemDAO.insert(item);
            }
            return prescriptionId;
        }
        return 0;
    }

    public int updatePrescription(Prescription prescription) {
        return prescriptionDAO.update(prescription);
    }

    public int deletePrescription(int id) {
        Prescription prescription = prescriptionDAO.findById(id);
        String status = prescription == null ? null : prescription.getStatus();
        boolean shouldRestoreStock = "dispensed".equals(status) || "\u5df2\u53d1\u836f".equals(status);
        List<PrescriptionItem> items = prescriptionItemDAO.findByPrescriptionId(id);
        for (PrescriptionItem item : items) {
            if (shouldRestoreStock) {
                drugService.restoreStock(item.getDrugId(), item.getNum(), "\u7cfb\u7edf");
            }
        }
        prescriptionItemDAO.deleteByPrescriptionId(id);
        return prescriptionDAO.delete(id);
    }

    public Prescription getPrescriptionById(int id) {
        return prescriptionDAO.findById(id);
    }

    public List<Prescription> getAllPrescriptions() {
        return prescriptionDAO.findAll();
    }

    public List<Prescription> getPrescriptionsByPatientId(int patientId) {
        return prescriptionDAO.findByPatientId(patientId);
    }

    public List<Prescription> getPrescriptionsByDoctorId(int doctorId) {
        return prescriptionDAO.findByDoctorId(doctorId);
    }

    public List<Prescription> getPrescriptionsByStatus(String status) {
        return prescriptionDAO.findByStatus(status);
    }

    public BigDecimal calculateTotalPrice(List<PrescriptionItem> items) {
        BigDecimal total = BigDecimal.ZERO;
        for (PrescriptionItem item : items) {
            total = total.add(item.getDrugPrice().multiply(new BigDecimal(item.getNum())));
        }
        return total;
    }

    public int updatePrescriptionStatus(int id, String newStatus) {
        Prescription prescription = prescriptionDAO.findById(id);
        if (prescription == null) return 0;

        String currentStatus = prescription.getStatus();
        if (currentStatus == null) currentStatus = "待审核";

        Set<String> allowedTransitions = VALID_TRANSITIONS.get(currentStatus);
        if (allowedTransitions == null || !allowedTransitions.contains(newStatus)) {
            return -1;
        }

        prescription.setStatus(newStatus);
        return prescriptionDAO.update(prescription);
    }
}
