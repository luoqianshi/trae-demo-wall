package service;

import bean.DrugSupplier;
import dao.DrugSupplierDAO;
import dao.impl.DrugSupplierDAOImpl;
import java.util.List;

public class DrugSupplierService {
    private DrugSupplierDAO dao = new DrugSupplierDAOImpl();

    public int add(DrugSupplier s) { return dao.insert(s); }
    public int update(DrugSupplier s) { return dao.update(s); }
    public List<DrugSupplier> getAll(String keyword) { return dao.findAll(keyword); }
    public int delete(int id) { return dao.delete(id); }
}