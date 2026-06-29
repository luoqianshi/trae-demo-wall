package dao;

import bean.PrescriptionExamination;
import java.util.List;

public interface PrescriptionExaminationDAO {
    int insert(PrescriptionExamination pe);
    int update(PrescriptionExamination pe);
    int delete(int id);
    PrescriptionExamination findById(int id);
    List<PrescriptionExamination> findAll();
    List<PrescriptionExamination> findByPrescriptionId(int prescriptionId);
    int deleteByPrescriptionId(int prescriptionId);
}
