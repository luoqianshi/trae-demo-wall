package dao;

import bean.VitalSign;
import java.util.List;

public interface VitalSignDAO {
    int insert(VitalSign vitalSign);
    int update(VitalSign vitalSign);
    int delete(int id);
    VitalSign findById(int id);
    List<VitalSign> findAll();
    List<VitalSign> findByInpatientId(int inpatientId);
    VitalSign findLatestByInpatientId(int inpatientId);
}