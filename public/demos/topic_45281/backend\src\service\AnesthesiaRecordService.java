package service;

import bean.AnesthesiaRecord;
import dao.AnesthesiaRecordDAO;
import dao.impl.AnesthesiaRecordDAOImpl;
import java.util.List;

public class AnesthesiaRecordService {
    private AnesthesiaRecordDAO dao = new AnesthesiaRecordDAOImpl();

    public int add(AnesthesiaRecord record) { return dao.insert(record); }
    public List<AnesthesiaRecord> getBySurgeryId(int surgeryId) { return dao.findBySurgeryId(surgeryId); }
    public List<AnesthesiaRecord> getAll() { return dao.findAll(); }
    public AnesthesiaRecord getById(int id) { return dao.findById(id); }
    public int update(AnesthesiaRecord record) { return dao.update(record); }
}
