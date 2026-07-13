package com.ice.template.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class TaskStateRecoveryRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public TaskStateRecoveryRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            int updated = jdbcTemplate.update("""
                    UPDATE task
                    SET status = 'failed',
                        progress = 0,
                        error_message = 'Backend service restarted, async ingestion task was interrupted before completion',
                        update_time = CURRENT_TIMESTAMP
                    WHERE category = 'knowledge_base'
                      AND type LIKE '%ingest'
                      AND status IN ('pending', 'running')
                      AND is_delete = 0
                    """);
            if (updated > 0) {
                log.warn("[TaskStateRecovery] recovered {} interrupted knowledge ingestion task(s)", updated);
            }
        } catch (Exception e) {
            log.warn("[TaskStateRecovery] skipped interrupted task recovery: {}", e.getMessage());
        }
    }
}
