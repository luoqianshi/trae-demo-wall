package dao;

import bean.NurseRecord;
import java.util.List;

public interface NurseRecordDAO {
    int insert(NurseRecord record);
    int update(NurseRecord record);
    int delete(int id);
    NurseRecord findById(int id);
    List<NurseRecord> findAll();
    List<NurseRecord> findByInpatientId(int inpatientId);
}