package service;

import bean.NursingRecord;
import dao.NursingRecordDAO;
import dao.impl.NursingRecordDAOImpl;
import java.util.List;

public class NursingRecordService {
    private NursingRecordDAO dao = new NursingRecordDAOImpl();

    public int add(NursingRecord n) {
        return dao.insert(n);
    }

    public NursingRecord getById(int id) {
        return dao.findNursingById(id);
    }

    public List<NursingRecord> getByInpatientId(int inpatientId) {
        return dao.findByNursingInpatientId(inpatientId);
    }

    public List<NursingRecord> getAll(String type, int page, int size) {
        return dao.findAllNursingRecords(type, page, size);
    }
}