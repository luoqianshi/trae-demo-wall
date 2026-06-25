package dao;

import bean.DrugSupplier;
import java.util.List;

public interface DrugSupplierDAO {
    int insert(DrugSupplier s);
    int update(DrugSupplier s);
    List<DrugSupplier> findAll(String keyword);
    int delete(int id);
}