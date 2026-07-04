package dao;

import bean.PrescriptionItem;
import java.util.List;

public interface PrescriptionItemDAO {
    int insert(PrescriptionItem item);
    int update(PrescriptionItem item);
    int delete(int id);
    int deleteByPrescriptionId(int prescriptionId);
    PrescriptionItem findById(int id);
    List<PrescriptionItem> findAll();
    List<PrescriptionItem> findByPrescriptionId(int prescriptionId);
    List<PrescriptionItem> findByDrugId(int drugId);
}
