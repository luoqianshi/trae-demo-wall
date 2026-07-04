package service;

import bean.MedicalQualityControl;
import dao.MedicalQualityControlDAO;
import dao.impl.MedicalQualityControlDAOImpl;
import java.util.List;

public class MedicalQualityControlService {
    private MedicalQualityControlDAO dao = new MedicalQualityControlDAOImpl();

    public int add(MedicalQualityControl q) {
        return dao.insert(q);
    }

    public int update(MedicalQualityControl q) {
        return dao.updateQC(q);
    }

    public MedicalQualityControl getById(int id) {
        return dao.findQCById(id);
    }

    public List<MedicalQualityControl> getAll(String targetType, String result, int page, int size) {
        return dao.findAllQCRecords(targetType, result, page, size);
    }
}