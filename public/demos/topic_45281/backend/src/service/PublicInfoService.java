package service;

import bean.PublicInfo;
import dao.impl.PublicInfoDAOImpl;
import java.util.List;

public class PublicInfoService {
    private PublicInfoDAOImpl dao = new PublicInfoDAOImpl();

    public int add(PublicInfo p) {
        return dao.insert(p);
    }

    public int update(PublicInfo p) {
        return dao.update(p);
    }

    public int delete(int id) {
        return dao.delete(id);
    }

    public PublicInfo getById(int id) {
        PublicInfo info = dao.findById(id);
        if (info != null) {
            dao.incrementView(info.getId());
        }
        return info;
    }

    public List<PublicInfo> getByCategory(String category, int page, int size) {
        return dao.findByCategory(category, page, size);
    }
}