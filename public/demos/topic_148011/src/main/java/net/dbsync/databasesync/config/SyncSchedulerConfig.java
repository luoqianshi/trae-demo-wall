package net.dbsync.databasesync.config;

import lombok.extern.slf4j.Slf4j;
import net.dbsync.databasesync.service.SyncManager;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

import java.util.List;

@Slf4j
@Data
@Configuration
@EnableScheduling
@ConfigurationProperties(prefix = "database-sync.scheduler")
public class SyncSchedulerConfig implements SchedulingConfigurer {

    private List<TaskConfig> tasks;

    private final DatabaseSyncConfig databaseSyncConfig;
    private final SyncManager syncManager;

    public SyncSchedulerConfig(DatabaseSyncConfig databaseSyncConfig) {
        this.databaseSyncConfig = databaseSyncConfig;
        this.syncManager = new SyncManager();
    }

    @Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        if (tasks == null || tasks.isEmpty()) {
            return;
        }

        for (TaskConfig task : tasks) {
            if (task.isEnabled()) {
                taskRegistrar.addCronTask(() -> executeTask(task), task.getCron());
            }
        }
    }

    private void executeTask(TaskConfig task) {
        log.info("Starting scheduled task: {}", task.getName());

        List<DatabaseSyncConfig.SyncPair> allSyncPairs = databaseSyncConfig.getSyncPairs();
        List<String> taskSyncPairs = task.getSyncPairs();

        int successCount = 0;
        int failCount = 0;

        if (taskSyncPairs == null || taskSyncPairs.isEmpty()) {
            for (DatabaseSyncConfig.SyncPair syncPair : allSyncPairs) {
                try {
                    syncManager.synchronize(syncPair);
                    successCount++;
                } catch (Exception e) {
                    failCount++;
                    log.error("Failed to synchronize sync pair '{}': {}", syncPair.getName(), e.getMessage(), e);
                }
            }
        } else {
            for (DatabaseSyncConfig.SyncPair syncPair : allSyncPairs) {
                if (taskSyncPairs.contains(syncPair.getName())) {
                    try {
                        syncManager.synchronize(syncPair);
                        successCount++;
                    } catch (Exception e) {
                        failCount++;
                        log.error("Failed to synchronize sync pair '{}': {}", syncPair.getName(), e.getMessage(), e);
                    }
                }
            }
        }

        log.info("Scheduled task '{}' completed: {} sync pairs succeeded, {} sync pairs failed", task.getName(), successCount, failCount);
    }

    @Data
    public static class TaskConfig {
        private String name;
        private boolean enabled = true;
        private String cron = "0 0 * * * ?";
        private List<String> syncPairs;
    }
}
