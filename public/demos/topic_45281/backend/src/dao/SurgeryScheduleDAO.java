package dao;
import bean.SurgerySchedule;
import java.util.List;
public interface SurgeryScheduleDAO {
    int insert(SurgerySchedule s);
    int update(SurgerySchedule s);
    SurgerySchedule findById(int id);
    List<SurgerySchedule> findBySurgeonId(int surgeonId);
    List<SurgerySchedule> findAll(String status, java.sql.Date date, int page, int size);
}
