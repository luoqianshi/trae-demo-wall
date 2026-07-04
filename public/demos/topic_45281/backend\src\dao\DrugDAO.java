package dao;

import bean.Drug;
import java.util.List;

public interface DrugDAO {
    int insert(Drug drug);
    int update(Drug drug);
    int delete(int id);
    Drug findById(int id);
    List<Drug> findAll();
    List<Drug> findByKeyword(String keyword);
    int updateStock(int drugId, int num);
    List<Drug> findLowStock();
    List<Drug> findExpiring();
    List<Drug> findExpired();
    boolean isUsedInPrescription(int drugId);
    boolean isUsedInStockLog(int drugId);
}
