package dao;

import bean.PublicInfo;
import java.util.List;

public interface PublicInfoDAO {
    int insert(PublicInfo p);
    PublicInfo findById(int id);
    List<PublicInfo> findByCategory(String category, int page, int size);
    int incrementView(int id);
    int update(PublicInfo p);
    int delete(int id);
}
