package dao;
import bean.AnesthesiaRecord;
import java.util.List;
public interface AnesthesiaRecordDAO {
    int insert(AnesthesiaRecord a);
    int update(AnesthesiaRecord a);
    AnesthesiaRecord findById(int id);
    List<AnesthesiaRecord> findBySurgeryId(int surgeryId);
    List<AnesthesiaRecord> findAll();
}
