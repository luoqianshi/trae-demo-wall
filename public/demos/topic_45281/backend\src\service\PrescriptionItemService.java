package service;

import bean.PrescriptionItem;
import dao.PrescriptionItemDAO;
import dao.impl.PrescriptionItemDAOImpl;
import java.util.List;

public class PrescriptionItemService {
    private PrescriptionItemDAO prescriptionItemDAO = new PrescriptionItemDAOImpl();

    public int addPrescriptionItem(PrescriptionItem item) {
        return prescriptionItemDAO.insert(item);
    }

    public int updatePrescriptionItem(PrescriptionItem item) {
        return prescriptionItemDAO.update(item);
    }

    public int deletePrescriptionItem(int id) {
        return prescriptionItemDAO.delete(id);
    }

    public PrescriptionItem getPrescriptionItemById(int id) {
        return prescriptionItemDAO.findById(id);
    }

    public List<PrescriptionItem> getAllPrescriptionItems() {
        return prescriptionItemDAO.findAll();
    }

    public List<PrescriptionItem> getPrescriptionItemsByPrescriptionId(int prescriptionId) {
        return prescriptionItemDAO.findByPrescriptionId(prescriptionId);
    }

    public List<PrescriptionItem> getPrescriptionItemsByDrugId(int drugId) {
        return prescriptionItemDAO.findByDrugId(drugId);
    }
}
