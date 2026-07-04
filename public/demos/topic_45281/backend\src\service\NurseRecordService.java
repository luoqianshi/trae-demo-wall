package service;

import bean.NurseRecord;
import dao.impl.NurseRecordDAOImpl;
import dao.NurseRecordDAO;
import java.util.List;

public class NurseRecordService {
    private NurseRecordDAO nurseRecordDAO = new NurseRecordDAOImpl();

    public int add(NurseRecord record) {
        return nurseRecordDAO.insert(record);
    }

    public int update(NurseRecord record) {
        return nurseRecordDAO.update(record);
    }

    public int delete(int id) {
        return nurseRecordDAO.delete(id);
    }

    public NurseRecord getById(int id) {
        return nurseRecordDAO.findById(id);
    }

    public List<NurseRecord> getAll() {
        return nurseRecordDAO.findAll();
    }

    public List<NurseRecord> getByInpatientId(int inpatientId) {
        return nurseRecordDAO.findByInpatientId(inpatientId);
    }
}