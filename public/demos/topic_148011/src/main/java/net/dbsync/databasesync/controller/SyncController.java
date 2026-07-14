package net.dbsync.databasesync.controller;

import lombok.extern.slf4j.Slf4j;
import net.dbsync.databasesync.config.DatabaseSyncConfig;
import net.dbsync.databasesync.service.SyncManager;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/sync")
public class SyncController {

    private final DatabaseSyncConfig databaseSyncConfig;
    private final SyncManager syncManager;

    public SyncController(DatabaseSyncConfig databaseSyncConfig) {
        this.databaseSyncConfig = databaseSyncConfig;
        this.syncManager = new SyncManager();
    }

    // 获取所有同步配置
    @GetMapping("/configs")
    public List<DatabaseSyncConfig.SyncPair> getSyncConfigs() {
        return databaseSyncConfig.getSyncPairs();
    }

    // 触发所有同步任务
    @PostMapping("/all")
    public String syncAll() {
        try {
            List<DatabaseSyncConfig.SyncPair> syncPairs = databaseSyncConfig.getSyncPairs();
            for (DatabaseSyncConfig.SyncPair syncPair : syncPairs) {
                syncManager.synchronize(syncPair);
            }
            return "All sync tasks completed successfully";
        } catch (SQLException e) {
            log.error(e.getMessage(), e);
            return "Sync failed: " + e.getMessage();
        }
    }

    // 触发指定同步任务
    @PostMapping("/{pairName}")
    public String syncByName(@PathVariable String pairName) {
        try {
            List<DatabaseSyncConfig.SyncPair> syncPairs = databaseSyncConfig.getSyncPairs();
            for (DatabaseSyncConfig.SyncPair syncPair : syncPairs) {
                if (syncPair.getName().equals(pairName)) {
                    syncManager.synchronize(syncPair);
                    return "Sync task completed successfully: " + pairName;
                }
            }
            return "Sync pair not found: " + pairName;
        } catch (SQLException e) {
            log.error(e.getMessage(), e);
            return "Sync failed: " + e.getMessage();
        }
    }

    // 清除连接池缓存
    @PostMapping("/clear-cache")
    public String clearCache() {
        syncManager.clearCache();
        return "Cache cleared successfully";
    }
}
