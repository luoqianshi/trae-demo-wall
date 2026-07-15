-- ============================================
-- V2: 修正表结构与代码对齐
-- ============================================

-- 1. 修正 t_video 表状态码注释，与实际代码行为对齐
-- 代码中使用的状态码：
-- 0 = 已上传 (PENDING)
-- 1 = 解析中 (RUNNING)
-- 2 = 已完成 (SUCCESS)
-- 3 = 失败 (FAILED)
ALTER TABLE t_video MODIFY COLUMN status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-已上传 1-解析中 2-已完成 3-失败';

-- 2. 修正 t_video_analysis 表状态码注释
ALTER TABLE t_video_analysis MODIFY COLUMN status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-待解析 1-解析中 2-成功 3-失败';

-- 3. 修正 t_fusion_task 表状态码注释
ALTER TABLE t_fusion_task MODIFY COLUMN status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-待生成 1-生成中 2-成功 3-失败';

-- 4. 修正 t_frame_task 表状态码注释
ALTER TABLE t_frame_task MODIFY COLUMN status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-待生成 1-生成中 2-成功 3-失败';

-- 5. 修正 t_audio_task 表状态码注释
ALTER TABLE t_audio_task MODIFY COLUMN status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-待生成 1-生成中 2-成功 3-失败';

-- 6. 修正 t_edit_project 表状态码注释
ALTER TABLE t_edit_project MODIFY COLUMN status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-草稿 1-编辑中 2-导出中 3-已导出';

-- 7. 确保 t_video.duration 类型与实体对齐 (INT -> DOUBLE)
ALTER TABLE t_video MODIFY COLUMN duration DOUBLE NOT NULL DEFAULT 0 COMMENT '视频时长(秒)';

-- 8. 确保 t_video.fps 类型与实体对齐 (DECIMAL -> DOUBLE)
ALTER TABLE t_video MODIFY COLUMN fps DOUBLE DEFAULT NULL COMMENT '帧率';

-- 9. 添加缺失的索引（使用 IGNORE 避免重复）
-- 注意：MySQL 8.0 的 ADD INDEX IF NOT EXISTS 在某些客户端可能不支持
-- 如果需要添加索引，请手动执行或在后续版本中处理
