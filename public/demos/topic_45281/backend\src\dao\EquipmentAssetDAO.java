package dao;
import bean.EquipmentAsset;
import java.util.List;
public interface EquipmentAssetDAO {
    int insert(EquipmentAsset e);
    int update(EquipmentAsset e);
    EquipmentAsset findById(int id);
    List<EquipmentAsset> findByDeptId(int deptId);
    List<EquipmentAsset> findAssets(String assetType, String assetStatus, int page, int size);
}
