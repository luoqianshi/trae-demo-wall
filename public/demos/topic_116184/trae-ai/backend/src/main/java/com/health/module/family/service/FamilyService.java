package com.health.module.family.service;

import com.health.common.BusinessException;
import com.health.common.ResultCode;
import com.health.module.family.dto.AuthorizeDTO;
import com.health.module.family.dto.CreateFamilyDTO;
import com.health.module.family.dto.FamilyMemberVO;
import com.health.module.family.dto.InviteMemberDTO;
import com.health.module.family.entity.FamilyGroup;
import com.health.module.family.entity.FamilyMember;
import com.health.module.family.mapper.FamilyGroupMapper;
import com.health.module.family.mapper.FamilyMemberMapper;
import com.health.module.health.dto.MetricVO;
import com.health.module.health.entity.AlertRecord;
import com.health.module.health.entity.HealthMetric;
import com.health.module.health.entity.HealthRecord;
import com.health.module.health.mapper.AlertRecordMapper;
import com.health.module.health.mapper.HealthMetricMapper;
import com.health.module.health.mapper.HealthRecordMapper;
import com.health.module.user.entity.SysUser;
import com.health.module.user.mapper.SysUserMapper;
import com.health.security.SecurityUtils;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 家庭账号服务.
 * <p>
 * 提供家庭组创建、成员邀请、指标查看授权与家庭成员健康指标查看功能。
 * 查看成员指标必须校验 authorized_view=1，未授权抛出业务异常。
 * 当前用户身份从 SecurityContext 获取，严禁前端传入。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Service
public class FamilyService {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(FamilyService.class);

    /** 家庭组成员数量上限（含创建者） */
    private static final int MEMBER_LIMIT = 6;

    /** 成员健康记录查询条数上限 */
    private static final int MEMBER_RECORD_LIMIT = 100;

    private final FamilyGroupMapper familyGroupMapper;

    private final FamilyMemberMapper familyMemberMapper;

    private final SysUserMapper sysUserMapper;

    private final HealthRecordMapper healthRecordMapper;

    private final HealthMetricMapper healthMetricMapper;

    private final AlertRecordMapper alertRecordMapper;

    public FamilyService(final FamilyGroupMapper familyGroupMapper,
                         final FamilyMemberMapper familyMemberMapper,
                         final SysUserMapper sysUserMapper,
                         final HealthRecordMapper healthRecordMapper,
                         final HealthMetricMapper healthMetricMapper,
                         final AlertRecordMapper alertRecordMapper) {
        this.familyGroupMapper = familyGroupMapper;
        this.familyMemberMapper = familyMemberMapper;
        this.sysUserMapper = sysUserMapper;
        this.healthRecordMapper = healthRecordMapper;
        this.healthMetricMapper = healthMetricMapper;
        this.alertRecordMapper = alertRecordMapper;
    }

    /**
     * 创建家庭组.
     * <p>
     * 创建家庭组后，创建者自动成为 OWNER 成员。
     * </p>
     *
     * @param dto 创建请求
     * @return 家庭组ID
     */
    public Long createGroup(final CreateFamilyDTO dto) {
        final Long userId = SecurityUtils.getCurrentUserId();

        final FamilyGroup group = new FamilyGroup();
        group.setOwnerId(userId);
        group.setName(dto.getName());
        familyGroupMapper.insert(group);

        // 创建者自动成为 OWNER，并默认授权查看自身指标
        final FamilyMember owner = new FamilyMember();
        owner.setGroupId(group.getId());
        owner.setUserId(userId);
        owner.setRole(FamilyMember.ROLE_OWNER);
        owner.setAuthorizedView(FamilyMember.AUTHORIZED_YES);
        familyMemberMapper.insert(owner);

        logger.info("家庭组创建成功: userId={}, groupId={}", userId, group.getId());
        return group.getId();
    }

    /**
     * 邀请家庭成员.
     * <p>
     * 仅 OWNER 可邀请，成员上限 6 人。通过手机号查询用户，被邀请人自动加入为 MEMBER。
     * </p>
     *
     * @param dto 邀请请求
     */
    public void inviteMember(final InviteMemberDTO dto) {
        final Long userId = SecurityUtils.getCurrentUserId();

        final FamilyGroup group = familyGroupMapper.selectById(dto.getGroupId());
        if (group == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "家庭组不存在");
        }

        // 校验当前用户为家庭组 OWNER
        final FamilyMember currentMember = findMember(dto.getGroupId(), userId);
        if (currentMember == null || !FamilyMember.ROLE_OWNER.equals(currentMember.getRole())) {
            throw new BusinessException(ResultCode.FORBIDDEN, "仅家庭组创建者可邀请成员");
        }

        // 校验成员数量上限
        final List<FamilyMember> members = familyMemberMapper.findByGroupId(dto.getGroupId());
        if (members.size() >= MEMBER_LIMIT) {
            throw new BusinessException(ResultCode.FAMILY_MEMBER_LIMIT);
        }

        // 通过手机号查询被邀请用户
        final SysUser invitee = sysUserMapper.findByPhone(dto.getPhone());
        if (invitee == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND, "该手机号对应的用户不存在");
        }

        // 校验是否已在组内
        final FamilyMember existing = findMember(dto.getGroupId(), invitee.getId());
        if (existing != null) {
            throw new BusinessException(ResultCode.BUSINESS_ERROR, "该用户已在家庭组中");
        }

        // 被邀请人自动加入，角色为 MEMBER，默认未授权查看
        final FamilyMember member = new FamilyMember();
        member.setGroupId(dto.getGroupId());
        member.setUserId(invitee.getId());
        member.setRole(FamilyMember.ROLE_MEMBER);
        member.setAuthorizedView(FamilyMember.AUTHORIZED_NO);
        familyMemberMapper.insert(member);

        logger.info("家庭成员邀请成功: groupId={}, inviteeId={}", dto.getGroupId(), invitee.getId());
    }

    /**
     * 查询家庭组成员列表.
     *
     * @param groupId 家庭组ID
     * @return 成员信息列表
     */
    public List<FamilyMemberVO> getGroupMembers(final Long groupId) {
        final Long userId = SecurityUtils.getCurrentUserId();

        // 校验当前用户在该家庭组内
        final FamilyMember currentMember = findMember(groupId, userId);
        if (currentMember == null) {
            throw new BusinessException(ResultCode.FORBIDDEN, "您不在该家庭组中");
        }

        final List<FamilyMember> members = familyMemberMapper.findByGroupId(groupId);

        // 批量查询成员用户信息，避免循环内逐条查询
        final List<Long> userIds = members.stream()
                .map(FamilyMember::getUserId).collect(Collectors.toList());
        final Map<Long, SysUser> userMap = loadUserMap(userIds);

        final List<FamilyMemberVO> voList = new ArrayList<>();
        for (final FamilyMember member : members) {
            // 显式赋值，禁止反射拷贝
            final FamilyMemberVO vo = new FamilyMemberVO();
            vo.setId(member.getId());
            vo.setUserId(member.getUserId());
            final SysUser user = userMap.get(member.getUserId());
            vo.setName(user == null ? "未知用户" : user.getName());
            vo.setRole(member.getRole());
            vo.setAuthorizedView(member.getAuthorizedView());
            vo.setCreatedAt(member.getCreatedAt());
            voList.add(vo);
        }
        return voList;
    }

    /**
     * 授权或取消授权成员查看指标.
     * <p>
     * 仅 OWNER 可操作授权。
     * </p>
     *
     * @param dto 授权请求
     */
    public void authorizeView(final AuthorizeDTO dto) {
        final Long userId = SecurityUtils.getCurrentUserId();

        // 校验当前用户为家庭组 OWNER
        final FamilyMember currentMember = findMember(dto.getGroupId(), userId);
        if (currentMember == null || !FamilyMember.ROLE_OWNER.equals(currentMember.getRole())) {
            throw new BusinessException(ResultCode.FORBIDDEN, "仅家庭组创建者可授权");
        }

        final FamilyMember member = familyMemberMapper.selectById(dto.getMemberId());
        if (member == null || !dto.getGroupId().equals(member.getGroupId())) {
            throw new BusinessException(ResultCode.NOT_FOUND, "家庭成员不存在");
        }

        // 校验授权值合法性
        if (dto.getAuthorizedView() != FamilyMember.AUTHORIZED_YES
                && dto.getAuthorizedView() != FamilyMember.AUTHORIZED_NO) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "授权状态值不合法");
        }

        member.setAuthorizedView(dto.getAuthorizedView());
        familyMemberMapper.updateById(member);

        logger.info("成员授权更新: groupId={}, memberId={}, authorizedView={}",
                dto.getGroupId(), dto.getMemberId(), dto.getAuthorizedView());
    }

    /**
     * 查看家庭成员的健康指标.
     * <p>
     * 必须校验目标成员的 authorized_view=1，未授权抛出 FAMILY_NOT_AUTHORIZED。
     * 返回成员最近各指标的最新值与告警等级。
     * </p>
     *
     * @param groupId  家庭组ID
     * @param memberId 成员记录ID
     * @return 成员健康指标列表
     */
    public List<MetricVO> getMemberHealth(final Long groupId, final Long memberId) {
        final Long userId = SecurityUtils.getCurrentUserId();

        // 校验当前用户在该家庭组内
        final FamilyMember currentMember = findMember(groupId, userId);
        if (currentMember == null) {
            throw new BusinessException(ResultCode.FORBIDDEN, "您不在该家庭组中");
        }

        final FamilyMember targetMember = familyMemberMapper.selectById(memberId);
        if (targetMember == null || !groupId.equals(targetMember.getGroupId())) {
            throw new BusinessException(ResultCode.NOT_FOUND, "家庭成员不存在");
        }

        // 必须校验 authorized_view=1，未授权禁止查看
        if (targetMember.getAuthorizedView() == null
                || targetMember.getAuthorizedView() != FamilyMember.AUTHORIZED_YES) {
            throw new BusinessException(ResultCode.FAMILY_NOT_AUTHORIZED);
        }

        // 查询成员最近 100 条健康记录（限制条数，按时间倒序）
        final List<HealthRecord> recentRecords = healthRecordMapper.findRecentRecordsByUser(
                targetMember.getUserId(), MEMBER_RECORD_LIMIT);

        // 每个 metricId 仅保留最新一条：recentRecords 已按时间倒序，
        // putIfAbsent 保证首个（最新）不被覆盖
        final Map<Long, HealthRecord> latestByMetric = new LinkedHashMap<>();
        for (final HealthRecord record : recentRecords) {
            latestByMetric.putIfAbsent(record.getMetricId(), record);
        }

        if (latestByMetric.isEmpty()) {
            return List.of();
        }

        // 批量查询指标信息
        final List<HealthMetric> metrics = healthMetricMapper.selectBatchIds(latestByMetric.keySet());
        final Map<Long, HealthMetric> metricMap = metrics.stream()
                .collect(Collectors.toMap(HealthMetric::getId, m -> m, (a, b) -> b));

        // 查询成员最新告警记录（每个指标最新一条）
        final List<AlertRecord> alerts = alertRecordMapper.findLatestAlerts(targetMember.getUserId());
        final Map<Long, AlertRecord> alertMap = alerts.stream()
                .collect(Collectors.toMap(AlertRecord::getMetricId, a -> a, (a, b) -> b));

        // 构建指标 VO 列表
        final List<MetricVO> voList = new ArrayList<>();
        for (final Map.Entry<Long, HealthRecord> entry : latestByMetric.entrySet()) {
            final HealthMetric metric = metricMap.get(entry.getKey());
            if (metric == null) {
                // 指标已被删除，跳过
                continue;
            }
            final MetricVO vo = new MetricVO();
            vo.setId(metric.getId());
            vo.setName(metric.getName());
            vo.setUnit(metric.getUnit());
            vo.setValue(entry.getValue().getValue());
            vo.setRecordedAt(entry.getValue().getRecordedAt());
            final AlertRecord alert = alertMap.get(entry.getKey());
            vo.setAlertLevel(alert != null ? alert.getLevel() : AlertRecord.LEVEL_NORMAL);
            voList.add(vo);
        }
        return voList;
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 查询指定家庭组中的某个用户成员记录.
     *
     * @param groupId 家庭组ID
     * @param userId  用户ID
     * @return 成员记录，不存在返回 null
     */
    private FamilyMember findMember(final Long groupId, final Long userId) {
        return familyMemberMapper.selectOne(
                new LambdaQueryWrapper<FamilyMember>()
                        .eq(FamilyMember::getGroupId, groupId)
                        .eq(FamilyMember::getUserId, userId));
    }

    /**
     * 批量加载用户信息.
     */
    private Map<Long, SysUser> loadUserMap(final List<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        final List<SysUser> users = sysUserMapper.selectBatchIds(userIds);
        return users.stream()
                .collect(Collectors.toMap(SysUser::getId, u -> u, (a, b) -> b));
    }
}
