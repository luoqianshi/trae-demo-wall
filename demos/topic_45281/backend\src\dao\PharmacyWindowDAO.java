package dao;

import bean.PharmacyWindow;
import java.util.List;

public interface PharmacyWindowDAO {
    int insert(PharmacyWindow w);
    List<PharmacyWindow> findAll(String type);
    int delete(int id);
}