package com.health.module.admin.service;

import com.health.module.admin.dto.AlertDistributionVO;
import com.health.module.admin.dto.StatsOverviewVO;
import com.health.module.admin.mapper.AdminMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;

/**
 * 后台管理统计服务.
 * <p>
 * 封装平台概览与异常分布统计查询逻辑。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Service
public class AdminService {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);

    private final AdminMapper adminMapper;

    public AdminService(final AdminMapper adminMapper) {
        this.adminMapper = adminMapper;
    }

    /**
     * 查询平台概览统计.
     * <p>
     * 包含用户总数、问诊总数、告警总数、今日活跃用户数。
     * 今日活跃以 health_record 当日有上报记录的去重用户数为准。
     * </p>
     *
     * @return 概览统计
     */
    public StatsOverviewVO getOverview() {
        final LocalDateTime todayStart = LocalDate.now().atTime(LocalTime.MIN);
        final StatsOverviewVO overview = adminMapper.selectOverview(todayStart);
        if (overview == null) {
            // 理论不会发生，兜底返回零值
            logger.warn("平台概览统计查询返回空，使用零值兜底");
            return buildEmptyOverview();
        }
        return overview;
    }

    /**
     * 查询指标异常分布统计.
     *
     * @return 异常分布列表
     */
    public List<AlertDistributionVO> getAlertDistribution() {
        final List<AlertDistributionVO> distribution = adminMapper.selectAlertDistribution();
        if (distribution == null) {
            return Collections.emptyList();
        }
        return distribution;
    }

    /**
     * 构建零值概览统计（兜底）.
     *
     * @return 零值概览
     */
    private StatsOverviewVO buildEmptyOverview() {
        final StatsOverviewVO vo = new StatsOverviewVO();
        vo.setUserCount(0L);
        vo.setConsultationCount(0L);
        vo.setAlertCount(0L);
        vo.setTodayActiveCount(0L);
        return vo;
    }
}
