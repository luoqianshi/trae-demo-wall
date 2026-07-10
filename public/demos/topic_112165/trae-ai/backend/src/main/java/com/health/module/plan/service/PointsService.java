package com.health.module.plan.service;

import com.health.common.BusinessException;
import com.health.common.ResultCode;
import com.health.module.plan.dto.ExchangeDTO;
import com.health.module.plan.dto.ExchangeItemVO;
import com.health.module.plan.dto.PointsVO;
import com.health.module.plan.dto.RankingVO;
import com.health.module.plan.entity.PointsBalance;
import com.health.module.plan.entity.PointsExchange;
import com.health.module.plan.entity.PointsRecord;
import com.health.module.plan.mapper.PointsBalanceMapper;
import com.health.module.plan.mapper.PointsExchangeMapper;
import com.health.module.plan.mapper.PointsRecordMapper;
import com.health.security.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * 积分服务.
 * <p>
 * 提供积分获得、消耗、余额查询、排行榜与商品兑换功能。
 * 当前用户身份从 SecurityContext 获取，严禁前端传入 userId。
 * 积分变动通过 {@code @Transactional} 保证余额与记录的一致性。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Service
public class PointsService {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(PointsService.class);

    /** 排行榜周期常量：本周. */
    public static final String PERIOD_WEEK = "WEEK";

    /** 排行榜周期常量：本月. */
    public static final String PERIOD_MONTH = "MONTH";

    /** 兑换商品列表查询上限. */
    private static final int EXCHANGE_LIST_LIMIT = 50;

    /** 排行榜查询上限. */
    private static final int RANKING_LIMIT = 50;

    private final PointsRecordMapper pointsRecordMapper;

    private final PointsBalanceMapper pointsBalanceMapper;

    private final PointsExchangeMapper pointsExchangeMapper;

    public PointsService(final PointsRecordMapper pointsRecordMapper,
                         final PointsBalanceMapper pointsBalanceMapper,
                         final PointsExchangeMapper pointsExchangeMapper) {
        this.pointsRecordMapper = pointsRecordMapper;
        this.pointsBalanceMapper = pointsBalanceMapper;
        this.pointsExchangeMapper = pointsExchangeMapper;
    }

    /**
     * 获得积分.
     * <p>
     * 更新余额（不存在则初始化为 0 后累加），写入积分记录。
     * </p>
     *
     * @param userId 用户ID
     * @param points 积分数（正数）
     * @param source 来源（CHECKIN/IMPROVE 等）
     * @param refId  关联ID，可空
     */
    @Transactional(rollbackFor = Exception.class)
    public void earnPoints(final Long userId, final int points, final String source, final Long refId) {
        if (points <= 0) {
            throw new BusinessException(ResultCode.BUSINESS_ERROR, "获得积分必须为正数");
        }

        final PointsBalance balance = getOrCreateBalance(userId);
        balance.setBalance(balance.getBalance() + points);
        pointsBalanceMapper.updateById(balance);

        final PointsRecord record = new PointsRecord();
        record.setUserId(userId);
        record.setPoints(points);
        record.setType(PointsRecord.TYPE_EARN);
        record.setSource(source);
        record.setRefId(refId);
        pointsRecordMapper.insert(record);

        logger.info("获得积分：userId={}, points={}, source={}", userId, points, source);
    }

    /**
     * 消耗积分.
     * <p>
     * 余额不足抛 POINTS_INSUFFICIENT。余额充足时扣减并写入消耗记录。
     * </p>
     *
     * @param userId 用户ID
     * @param points 积分数（正数）
     * @param source 来源（EXCHANGE 等）
     * @param refId  关联ID，可空
     */
    @Transactional(rollbackFor = Exception.class)
    public void spendPoints(final Long userId, final int points, final String source, final Long refId) {
        if (points <= 0) {
            throw new BusinessException(ResultCode.BUSINESS_ERROR, "消耗积分必须为正数");
        }

        final PointsBalance balance = getOrCreateBalance(userId);
        if (balance.getBalance() < points) {
            throw new BusinessException(ResultCode.POINTS_INSUFFICIENT);
        }

        balance.setBalance(balance.getBalance() - points);
        pointsBalanceMapper.updateById(balance);

        final PointsRecord record = new PointsRecord();
        record.setUserId(userId);
        record.setPoints(-points);
        record.setType(PointsRecord.TYPE_SPEND);
        record.setSource(source);
        record.setRefId(refId);
        pointsRecordMapper.insert(record);

        logger.info("消耗积分：userId={}, points={}, source={}", userId, points, source);
    }

    /**
     * 查询当前用户积分余额与最近记录.
     *
     * @return 积分信息 VO
     */
    public PointsVO getBalance() {
        final Long userId = SecurityUtils.getCurrentUserId();
        final PointsBalance balance = getOrCreateBalance(userId);

        final List<PointsRecord> records = pointsRecordMapper.findByUserId(userId);
        if (records == null) {
            return buildPointsVO(balance.getBalance(), Collections.emptyList());
        }

        return buildPointsVO(balance.getBalance(), records);
    }

    /**
     * 查询积分排行榜.
     *
     * @param period 周期 WEEK/MONTH
     * @return 排行榜列表
     */
    public List<RankingVO> getRanking(final String period) {
        final LocalDateTime now = LocalDateTime.now();
        final LocalDateTime startTime;
        if (PERIOD_MONTH.equals(period)) {
            // 本月：从本月1日 00:00:00 开始
            startTime = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
        } else {
            // 默认本周：从本周一 00:00:00 开始
            startTime = now.toLocalDate()
                    .with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                    .atTime(LocalTime.MIN);
        }

        final List<RankingVO> ranking = pointsRecordMapper.ranking(startTime, now);
        if (ranking == null) {
            return Collections.emptyList();
        }
        return ranking;
    }

    /**
     * 查询可兑换商品列表.
     *
     * @return 兑换商品列表
     */
    public List<ExchangeItemVO> getExchangeItems() {
        final List<PointsExchange> items = pointsExchangeMapper.findEnabled();
        if (items == null || items.isEmpty()) {
            return Collections.emptyList();
        }

        final List<ExchangeItemVO> voList = new ArrayList<>();
        for (final PointsExchange item : items) {
            voList.add(buildExchangeItemVO(item));
        }
        return voList;
    }

    /**
     * 兑换商品.
     * <p>
     * 事务操作：校验商品上架与库存、扣减积分、扣减库存、写入消耗记录。
     * 库存不足抛 EXCHANGE_OUT_OF_STOCK。
     * </p>
     *
     * @param dto 兑换请求
     */
    @Transactional(rollbackFor = Exception.class)
    public void exchange(final ExchangeDTO dto) {
        final Long userId = SecurityUtils.getCurrentUserId();
        final PointsExchange item = pointsExchangeMapper.selectById(dto.getItemId());
        if (item == null || item.getEnabled() == null || item.getEnabled() != 1) {
            throw new BusinessException(ResultCode.NOT_FOUND, "兑换商品不存在或已下架");
        }

        final Integer stock = item.getStock();
        if (stock == null || stock <= 0) {
            throw new BusinessException(ResultCode.EXCHANGE_OUT_OF_STOCK);
        }

        // 先扣减积分（余额不足会抛异常并回滚）
        spendPoints(userId, item.getPointsCost(), PointsRecord.SOURCE_EXCHANGE, item.getId());

        // 扣减库存
        item.setStock(stock - 1);
        pointsExchangeMapper.updateById(item);

        logger.info("兑换商品：userId={}, itemId={}, itemName={}, cost={}",
                userId, item.getId(), item.getItemName(), item.getPointsCost());
    }

    // ==================== 内部辅助方法 ====================

    /**
     * 获取或初始化用户积分余额.
     * <p>
     * 余额记录不存在时插入一条初始余额为 0 的记录。
     * </p>
     *
     * @param userId 用户ID
     * @return 余额实体
     */
    private PointsBalance getOrCreateBalance(final Long userId) {
        PointsBalance balance = pointsBalanceMapper.findByUserId(userId);
        if (balance == null) {
            balance = new PointsBalance();
            balance.setUserId(userId);
            balance.setBalance(0);
            pointsBalanceMapper.insert(balance);
        }
        return balance;
    }

    /**
     * 构建积分信息 VO.
     *
     * @param balance 余额
     * @param records 记录列表
     * @return 积分信息 VO
     */
    private PointsVO buildPointsVO(final Integer balance, final List<PointsRecord> records) {
        final PointsVO vo = new PointsVO();
        vo.setBalance(balance);
        vo.setRecords(records);
        return vo;
    }

    /**
     * 构建兑换商品 VO.
     *
     * @param item 兑换商品实体
     * @return 兑换商品 VO
     */
    private ExchangeItemVO buildExchangeItemVO(final PointsExchange item) {
        final ExchangeItemVO vo = new ExchangeItemVO();
        vo.setId(item.getId());
        vo.setItemName(item.getItemName());
        vo.setDescription(item.getDescription());
        vo.setPointsCost(item.getPointsCost());
        vo.setStock(item.getStock());
        vo.setImageUrl(item.getImageUrl());
        return vo;
    }
}
