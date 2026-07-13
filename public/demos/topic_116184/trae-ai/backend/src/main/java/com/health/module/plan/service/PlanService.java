package com.health.module.plan.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.health.common.BusinessException;
import com.health.common.ResultCode;
import com.health.module.health.entity.AlertRecord;
import com.health.module.health.entity.HealthMetric;
import com.health.module.health.mapper.AlertRecordMapper;
import com.health.module.health.mapper.HealthMetricMapper;
import com.health.module.plan.dto.CheckinDTO;
import com.health.module.plan.dto.CreatePlanDTO;
import com.health.module.plan.dto.PlanVO;
import com.health.module.plan.entity.HealthPlan;
import com.health.module.plan.entity.PlanCheckin;
import com.health.module.plan.entity.PointsRecord;
import com.health.module.plan.mapper.HealthPlanMapper;
import com.health.module.plan.mapper.PlanCheckinMapper;
import com.health.security.SecurityUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 健康计划服务.
 * <p>
 * 提供计划创建、推荐、打卡与查询功能。
 * 当前用户身份从 SecurityContext 获取，严禁前端传入 userId。
 * 打卡后通过 {@link PointsService} 发放积分。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Service
public class PlanService {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(PlanService.class);

    /** 计划类型常量：减重. */
    public static final String TYPE_WEIGHT_LOSS = "WEIGHT_LOSS";

    /** 计划类型常量：血压管理. */
    public static final String TYPE_BLOOD_PRESSURE = "BLOOD_PRESSURE";

    /** 计划类型常量：血糖管理. */
    public static final String TYPE_BLOOD_SUGAR = "BLOOD_SUGAR";

    /** 计划类型常量：综合改善. */
    public static final String TYPE_GENERAL = "GENERAL";

    /** 打卡奖励积分. */
    private static final int CHECKIN_REWARD_POINTS = 10;

    /** 计划列表查询上限. */
    private static final int PLAN_LIST_LIMIT = 100;

    private final HealthPlanMapper healthPlanMapper;

    private final PlanCheckinMapper planCheckinMapper;

    private final AlertRecordMapper alertRecordMapper;

    private final HealthMetricMapper healthMetricMapper;

    private final PointsService pointsService;

    /** ObjectMapper 由 Spring 容器注入，禁止 new ObjectMapper() */
    private final ObjectMapper objectMapper;

    public PlanService(final HealthPlanMapper healthPlanMapper,
                       final PlanCheckinMapper planCheckinMapper,
                       final AlertRecordMapper alertRecordMapper,
                       final HealthMetricMapper healthMetricMapper,
                       final PointsService pointsService,
                       final ObjectMapper objectMapper) {
        this.healthPlanMapper = healthPlanMapper;
        this.planCheckinMapper = planCheckinMapper;
        this.alertRecordMapper = alertRecordMapper;
        this.healthMetricMapper = healthMetricMapper;
        this.pointsService = pointsService;
        this.objectMapper = objectMapper;
    }

    /**
     * 创建健康计划.
     *
     * @param dto 创建计划请求
     * @return 创建的计划ID
     */
    @Transactional(rollbackFor = Exception.class)
    public Long createPlan(final CreatePlanDTO dto) {
        final Long userId = SecurityUtils.getCurrentUserId();

        if (dto.getPeriodStart().isAfter(dto.getPeriodEnd())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "周期开始日期不能晚于结束日期");
        }

        final HealthPlan plan = new HealthPlan();
        plan.setUserId(userId);
        plan.setType(dto.getType());
        plan.setGoal(dto.getGoal());
        plan.setTasks(serializeTasks(dto.getTasks()));
        plan.setPeriodStart(dto.getPeriodStart());
        plan.setPeriodEnd(dto.getPeriodEnd());
        plan.setProgress(0);
        plan.setStatus(HealthPlan.STATUS_ACTIVE);

        healthPlanMapper.insert(plan);
        logger.info("创建健康计划：userId={}, planId={}, type={}", userId, plan.getId(), dto.getType());
        return plan.getId();
    }

    /**
     * 根据用户异常指标推荐健康计划.
     * <p>
     * 查询用户最新告警记录，过滤出异常（非 NORMAL）指标，
     * 按指标名称匹配计划类型并生成推荐计划（未持久化）。
     * </p>
     *
     * @return 推荐计划列表
     */
    public List<PlanVO> recommendPlan() {
        final Long userId = SecurityUtils.getCurrentUserId();

        final List<AlertRecord> alerts = alertRecordMapper.findLatestAlerts(userId);
        if (alerts == null || alerts.isEmpty()) {
            return Collections.emptyList();
        }

        // 收集异常指标ID（去重），并查询指标详情以获取名称
        final List<Long> metricIds = new ArrayList<>();
        for (final AlertRecord alert : alerts) {
            if (!AlertRecord.LEVEL_NORMAL.equals(alert.getLevel()) && alert.getMetricId() != null) {
                metricIds.add(alert.getMetricId());
            }
        }

        if (metricIds.isEmpty()) {
            return Collections.emptyList();
        }

        final List<HealthMetric> metrics = healthMetricMapper.selectBatchIds(metricIds);
        final Map<String, HealthMetric> metricMap = new HashMap<>();
        for (final HealthMetric metric : metrics) {
            metricMap.put(metric.getName(), metric);
        }

        final List<PlanVO> recommendations = new ArrayList<>();
        for (final HealthMetric metric : metrics) {
            final PlanVO vo = buildRecommendationByMetric(metric);
            if (vo != null) {
                recommendations.add(vo);
            }
        }

        return recommendations;
    }

    /**
     * 计划打卡.
     * <p>
     * 校验计划归属与当天是否已打卡，写入打卡记录后更新计划进度并发放积分。
     * </p>
     *
     * @param dto 打卡请求
     */
    @Transactional(rollbackFor = Exception.class)
    public void checkin(final CheckinDTO dto) {
        final Long userId = SecurityUtils.getCurrentUserId();
        final HealthPlan plan = healthPlanMapper.selectById(dto.getPlanId());
        if (plan == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "健康计划不存在");
        }
        if (!userId.equals(plan.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN, "无权操作该健康计划");
        }
        if (!HealthPlan.STATUS_ACTIVE.equals(plan.getStatus())) {
            throw new BusinessException(ResultCode.BUSINESS_ERROR, "计划已结束，无法打卡");
        }

        // 校验打卡日期是否在计划周期内
        if (dto.getTaskDate().isBefore(plan.getPeriodStart())
                || dto.getTaskDate().isAfter(plan.getPeriodEnd())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "打卡日期不在计划周期内");
        }

        // 当天已打卡则拒绝重复打卡
        final PlanCheckin existCheckin = planCheckinMapper.findByPlanIdAndDate(dto.getPlanId(), dto.getTaskDate());
        if (existCheckin != null) {
            throw new BusinessException(ResultCode.BUSINESS_ERROR, "当日已打卡，请勿重复打卡");
        }

        final PlanCheckin checkin = new PlanCheckin();
        checkin.setPlanId(dto.getPlanId());
        checkin.setUserId(userId);
        checkin.setTaskDate(dto.getTaskDate());
        checkin.setCompleted(1);
        planCheckinMapper.insert(checkin);

        // 更新计划进度：已打卡天数 / 计划总天数 * 100
        final int totalDays = calculatePlanDays(plan);
        final int newProgress = calculateProgress(1, totalDays, plan.getProgress());
        plan.setProgress(newProgress);
        if (newProgress >= 100) {
            plan.setStatus(HealthPlan.STATUS_COMPLETED);
        }
        healthPlanMapper.updateById(plan);

        // 发放打卡积分
        pointsService.earnPoints(userId, CHECKIN_REWARD_POINTS, PointsRecord.SOURCE_CHECKIN, plan.getId());

        logger.info("计划打卡：userId={}, planId={}, taskDate={}, progress={}",
                userId, dto.getPlanId(), dto.getTaskDate(), newProgress);
    }

    /**
     * 查询当前用户的计划列表.
     *
     * @return 计划列表
     */
    public List<PlanVO> getMyPlans() {
        final Long userId = SecurityUtils.getCurrentUserId();
        final List<HealthPlan> plans = healthPlanMapper.findByUserId(userId);
        if (plans == null || plans.isEmpty()) {
            return Collections.emptyList();
        }

        final List<PlanVO> voList = new ArrayList<>();
        for (final HealthPlan plan : plans) {
            voList.add(buildPlanVO(plan));
        }
        return voList;
    }

    // ==================== 内部辅助方法 ====================

    /**
     * 根据指标名称匹配计划类型并构建推荐计划.
     * <p>
     * 匹配规则基于指标名称关键字：血压、血糖、体重等。
     * </p>
     *
     * @param metric 健康指标
     * @return 推荐计划 VO，无法匹配返回 null
     */
    private PlanVO buildRecommendationByMetric(final HealthMetric metric) {
        final String name = metric.getName();
        if (StringUtils.isBlank(name)) {
            return null;
        }

        final String planType;
        final String goal;
        final List<String> tasks;

        if (name.contains("血压")) {
            planType = TYPE_BLOOD_PRESSURE;
            goal = "将血压控制在正常范围内";
            tasks = Arrays.asList("每日监测血压", "低盐低脂饮食", "适量有氧运动 30 分钟", "保持充足睡眠");
        } else if (name.contains("血糖")) {
            planType = TYPE_BLOOD_SUGAR;
            goal = "将血糖控制在正常范围内";
            tasks = Arrays.asList("每日监测血糖", "控制碳水摄入", "餐后散步 20 分钟", "避免高糖食物");
        } else if (name.contains("体重") || name.contains("BMI")) {
            planType = TYPE_WEIGHT_LOSS;
            goal = "将体重降至健康范围";
            tasks = Arrays.asList("每日称重记录", "控制每日热量摄入", "有氧运动 40 分钟", "减少高热量食物");
        } else {
            planType = TYPE_GENERAL;
            goal = "改善 " + name + " 指标至正常范围";
            tasks = Arrays.asList("定期监测 " + name, "保持健康饮食", "适量运动", "规律作息");
        }

        final PlanVO vo = new PlanVO();
        vo.setType(planType);
        vo.setGoal(goal);
        vo.setTasks(tasks);
        vo.setProgress(0);
        vo.setStatus(HealthPlan.STATUS_ACTIVE);

        final LocalDate today = LocalDate.now();
        vo.setPeriodStart(today);
        vo.setPeriodEnd(today.plusDays(30));
        return vo;
    }

    /**
     * 构建计划展示 VO.
     *
     * @param plan 计划实体
     * @return 计划 VO
     */
    private PlanVO buildPlanVO(final HealthPlan plan) {
        final PlanVO vo = new PlanVO();
        vo.setId(plan.getId());
        vo.setType(plan.getType());
        vo.setGoal(plan.getGoal());
        vo.setTasks(parseTasks(plan.getTasks()));
        vo.setPeriodStart(plan.getPeriodStart());
        vo.setPeriodEnd(plan.getPeriodEnd());
        vo.setProgress(plan.getProgress());
        vo.setStatus(plan.getStatus());
        return vo;
    }

    /**
     * 将任务列表序列化为 JSON 字符串（存入数据库）.
     *
     * @param tasks 任务列表
     * @return JSON 字符串
     */
    private String serializeTasks(final List<String> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(tasks);
        } catch (final JsonProcessingException e) {
            logger.error("序列化计划任务JSON失败", e);
            throw new BusinessException(ResultCode.BUSINESS_ERROR, "计划任务序列化失败", e);
        }
    }

    /**
     * 将数据库中的 JSON 字符串解析为任务列表.
     *
     * @param tasksJson JSON 字符串
     * @return 任务列表，空或解析失败返回空列表
     */
    private List<String> parseTasks(final String tasksJson) {
        if (StringUtils.isBlank(tasksJson)) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(tasksJson, new TypeReference<List<String>>() {
            });
        } catch (final JsonProcessingException e) {
            logger.error("解析计划任务JSON失败: {}", tasksJson, e);
            return Collections.emptyList();
        }
    }

    /**
     * 计算计划总天数（含首尾）.
     *
     * @param plan 计划
     * @return 总天数，最小为 1
     */
    private int calculatePlanDays(final HealthPlan plan) {
        final long days = ChronoUnit.DAYS.between(plan.getPeriodStart(), plan.getPeriodEnd()) + 1;
        return days <= 0 ? 1 : (int) days;
    }

    /**
     * 计算更新后的进度百分比.
     * <p>
     * 当前进度 + 单次打卡进度增量，上限 100。
     * </p>
     *
     * @param increment     单次打卡增量（占位，固定为1天）
     * @param totalDays     计划总天数
     * @param currentProgress 当前进度
     * @return 新进度百分比
     */
    private int calculateProgress(final int increment, final int totalDays, final Integer currentProgress) {
        final int base = currentProgress == null ? 0 : currentProgress;
        final int delta = (int) ((increment * 100L) / totalDays);
        final int result = base + delta;
        return Math.min(result, 100);
    }
}
