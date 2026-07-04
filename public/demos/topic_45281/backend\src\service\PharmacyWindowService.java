package service;

import bean.PharmacyWindow;
import dao.PharmacyWindowDAO;
import dao.impl.PharmacyWindowDAOImpl;
import java.util.List;

public class PharmacyWindowService {
    private PharmacyWindowDAO dao = new PharmacyWindowDAOImpl();

    public int add(PharmacyWindow w) { return dao.insert(w); }
    public List<PharmacyWindow> getAll(String type) { return dao.findAll(type); }
    public int delete(int id) { return dao.delete(id); }
}