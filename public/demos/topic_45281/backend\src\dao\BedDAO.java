package dao;

import bean.Bed;
import java.util.List;

public interface BedDAO {
    int insert(Bed bed);
    int update(Bed bed);
    int delete(int id);
    int deleteAll();
    Bed findById(int id);
    List<Bed> findAll();
    List<Bed> findByDept(String dept);
    List<Bed> findByStatus(String status);
}