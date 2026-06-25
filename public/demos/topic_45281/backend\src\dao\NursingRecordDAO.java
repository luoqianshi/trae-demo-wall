package dao;
import bean.NursingRecord;
import java.util.List;

public interface NursingRecordDAO {
    int insert(NursingRecord n);
    NursingRecord findNursingById(int id);
    List<NursingRecord> findByNursingInpatientId(int inpatientId);
    List<NursingRecord> findAllNursingRecords(String type, int page, int size);
}
