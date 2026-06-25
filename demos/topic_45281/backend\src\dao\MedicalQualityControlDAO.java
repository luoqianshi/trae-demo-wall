package dao;
import bean.MedicalQualityControl;
import java.util.List;

public interface MedicalQualityControlDAO {
    int insert(MedicalQualityControl q);
    int updateQC(MedicalQualityControl q);
    MedicalQualityControl findQCById(int id);
    List<MedicalQualityControl> findAllQCRecords(String targetType, String result, int page, int size);
}
