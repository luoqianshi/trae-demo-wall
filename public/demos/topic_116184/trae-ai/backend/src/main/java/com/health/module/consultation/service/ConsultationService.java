package com.health.module.consultation.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.health.common.BusinessException;
import com.health.common.PageResult;
import com.health.common.ResultCode;
import com.health.module.consultation.dto.ConsultationVO;
import com.health.module.consultation.dto.DoctorVO;
import com.health.module.consultation.dto.EvaluateDTO;
import com.health.module.consultation.dto.MessageVO;
import com.health.module.consultation.dto.ReplyDTO;
import com.health.module.consultation.dto.SendMessageDTO;
import com.health.module.consultation.dto.StartConsultationDTO;
import com.health.module.consultation.entity.Consultation;
import com.health.module.consultation.entity.ConsultationMessage;
import com.health.module.consultation.mapper.ConsultationMapper;
import com.health.module.consultation.mapper.ConsultationMessageMapper;
import com.health.module.user.entity.SysUser;
import com.health.module.user.mapper.SysUserMapper;
import com.health.security.SecurityUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 问诊会话服务.
 * <p>
 * 提供在线医生查询、问诊发起、消息收发、异步回复、会话关闭与评价等功能。
 * 当前用户身份统一从 SecurityContext 获取，严禁前端传入 userId。
 * 医生在线状态通过 Redis 维护，消息通过 WebSocket（STOMP）实时推送。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Service
public class ConsultationService {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(ConsultationService.class);

    /** Redis 键前缀：医生在线状态，key=doctor:online:{userId} */
    private static final String DOCTOR_ONLINE_KEY_PREFIX = "doctor:online:";

    /** WebSocket 推送目的地前缀：/topic/consultation/{consultationId} */
    private static final String WS_DESTINATION_PREFIX = "/topic/consultation/";

    /** 异步问诊最大追问次数 */
    private static final int MAX_ASYNC_REPLY_COUNT = 3;

    /** 历史消息查询默认条数上限 */
    private static final int MESSAGE_QUERY_LIMIT = 200;

    private final ConsultationMapper consultationMapper;

    private final ConsultationMessageMapper consultationMessageMapper;

    private final SysUserMapper sysUserMapper;

    private final RedisTemplate<String, Object> redisTemplate;

    private final SimpMessagingTemplate simpMessagingTemplate;

    /** ObjectMapper 由 Spring 容器注入，禁止 new ObjectMapper() */
    private final ObjectMapper objectMapper;

    public ConsultationService(final ConsultationMapper consultationMapper,
                               final ConsultationMessageMapper consultationMessageMapper,
                               final SysUserMapper sysUserMapper,
                               final RedisTemplate<String, Object> redisTemplate,
                               final SimpMessagingTemplate simpMessagingTemplate,
                               final ObjectMapper objectMapper) {
        this.consultationMapper = consultationMapper;
        this.consultationMessageMapper = consultationMessageMapper;
        this.sysUserMapper = sysUserMapper;
        this.redisTemplate = redisTemplate;
        this.simpMessagingTemplate = simpMessagingTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * 查询已审核通过的医生列表，并从 Redis 标记在线状态.
     *
     * @return 医生列表（含在线标记）
     */
    public List<DoctorVO> getOnlineDoctors() {
        final List<DoctorVO> doctors = consultationMapper.findOnlineDoctors();
        if (doctors == null || doctors.isEmpty()) {
            return Collections.emptyList();
        }

        for (final DoctorVO doctor : doctors) {
            final boolean online = isDoctorOnline(doctor.getId());
            doctor.setOnline(online);
        }
        return doctors;
    }

    /**
     * 发起问诊会话.
     * <p>
     * REALTIME 类型直接进入 IN_PROGRESS 状态，ASYNC 类型为 WAITING 状态等待医生回复。
     * </p>
     *
     * @param dto 发起问诊请求
     * @return 创建的会话ID
     */
    @Transactional(rollbackFor = Exception.class)
    public Long startConsultation(final StartConsultationDTO dto) {
        final Long userId = SecurityUtils.getCurrentUserId();

        final Consultation consultation = new Consultation();
        consultation.setUserId(userId);
        consultation.setDoctorId(dto.getDoctorId());
        consultation.setType(dto.getType());
        consultation.setChiefComplaint(dto.getChiefComplaint());
        consultation.setSymptomDesc(dto.getSymptomDesc());
        consultation.setDuration(dto.getDuration());
        consultation.setAccompanying(dto.getAccompanying());
        consultation.setImages(serializeImages(dto.getImages()));
        consultation.setReplyCount(0);

        // REALTIME 直接进行中，ASYNC 等待医生回复
        if (Consultation.TYPE_REALTIME.equals(dto.getType())) {
            consultation.setStatus(Consultation.STATUS_IN_PROGRESS);
        } else {
            consultation.setStatus(Consultation.STATUS_WAITING);
        }

        consultationMapper.insert(consultation);
        logger.info("发起问诊：userId={}, doctorId={}, type={}, consultationId={}",
                userId, dto.getDoctorId(), dto.getType(), consultation.getId());
        return consultation.getId();
    }

    /**
     * 查询当前用户的问诊列表（分页）.
     *
     * @param page 页码（从1开始）
     * @param size 每页条数
     * @return 分页结果
     */
    public PageResult<ConsultationVO> getMyConsultations(final int page, final int size) {
        final Long userId = SecurityUtils.getCurrentUserId();
        final int offset = (page - 1) * size;

        final List<ConsultationVO> records = consultationMapper.findUserConsultations(userId, size, offset);
        final long total = consultationMapper.selectCount(
                new LambdaQueryWrapper<Consultation>().eq(Consultation::getUserId, userId));

        fillImages(records);
        return new PageResult<>(page, size, total, records);
    }

    /**
     * 查询当前医生的接诊列表（分页）.
     *
     * @param page 页码（从1开始）
     * @param size 每页条数
     * @return 分页结果
     */
    public PageResult<ConsultationVO> getDoctorConsultations(final int page, final int size) {
        final Long doctorId = SecurityUtils.getCurrentUserId();
        final int offset = (page - 1) * size;

        final List<ConsultationVO> records = consultationMapper.findDoctorConsultations(doctorId, size, offset);
        final long total = consultationMapper.selectCount(
                new LambdaQueryWrapper<Consultation>().eq(Consultation::getDoctorId, doctorId));

        fillImages(records);
        return new PageResult<>(page, size, total, records);
    }

    /**
     * 查询问诊历史消息.
     * <p>
     * 权限校验：只有会话的 user 或 doctor 能查看。
     * </p>
     *
     * @param consultationId 会话ID
     * @return 消息列表（含发送者信息）
     */
    public List<MessageVO> getMessages(final Long consultationId) {
        final Long currentUserId = SecurityUtils.getCurrentUserId();
        final Consultation consultation = getConsultationOrThrow(consultationId);
        checkConsultationPermission(consultation, currentUserId);

        final List<ConsultationMessage> messages =
                consultationMessageMapper.findByConsultationId(consultationId);
        return buildMessageVOList(consultation, messages);
    }

    /**
     * 发送问诊消息.
     * <p>
     * 校验会话状态与权限后持久化消息，并通过 WebSocket 实时推送。
     * </p>
     *
     * @param dto 发送消息请求
     * @return 消息VO（含发送者信息）
     */
    @Transactional(rollbackFor = Exception.class)
    public MessageVO sendMessage(final SendMessageDTO dto) {
        final Long currentUserId = SecurityUtils.getCurrentUserId();
        final Consultation consultation = getConsultationOrThrow(dto.getConsultationId());

        // 已关闭的会话禁止发消息
        if (Consultation.STATUS_CLOSED.equals(consultation.getStatus())) {
            throw new BusinessException(ResultCode.CONSULTATION_CLOSED);
        }
        checkConsultationPermission(consultation, currentUserId);

        // 根据当前用户在会话中的身份确定发送者类型
        final String senderType;
        if (currentUserId.equals(consultation.getDoctorId())) {
            senderType = ConsultationMessage.SENDER_DOCTOR;
        } else {
            senderType = ConsultationMessage.SENDER_USER;
        }

        final ConsultationMessage message = new ConsultationMessage();
        message.setConsultationId(dto.getConsultationId());
        message.setSenderType(senderType);
        message.setContentType(dto.getContentType());
        message.setContent(dto.getContent());
        message.setSentAt(LocalDateTime.now());
        message.setReadStatus(0);
        consultationMessageMapper.insert(message);

        // 构建 VO 并通过 WebSocket 推送
        final List<ConsultationMessage> singleMessage = Collections.singletonList(message);
        final List<MessageVO> voList = buildMessageVOList(consultation, singleMessage);

        // 集合仅一条元素：刚发送的消息，取第一条即为当前消息
        final MessageVO messageVO = voList.get(0);
        pushWebSocketMessage(dto.getConsultationId(), messageVO);

        logger.info("发送问诊消息：consultationId={}, senderType={}, contentType={}",
                dto.getConsultationId(), senderType, dto.getContentType());
        return messageVO;
    }

    /**
     * 医生异步回复.
     * <p>
     * 仅异步问诊适用，reply_count 达到上限（3次）后禁止继续回复。
     * </p>
     *
     * @param dto 异步回复请求
     * @return 消息VO（含发送者信息）
     */
    @Transactional(rollbackFor = Exception.class)
    public MessageVO replyAsync(final ReplyDTO dto) {
        final Long currentUserId = SecurityUtils.getCurrentUserId();
        final Consultation consultation = getConsultationOrThrow(dto.getConsultationId());

        // 仅异步问诊可使用此接口
        if (!Consultation.TYPE_ASYNC.equals(consultation.getType())) {
            throw new BusinessException(ResultCode.BUSINESS_ERROR, "仅异步问诊支持追问回复");
        }
        // 已关闭的会话禁止回复
        if (Consultation.STATUS_CLOSED.equals(consultation.getStatus())) {
            throw new BusinessException(ResultCode.CONSULTATION_CLOSED);
        }
        // 仅该会话的医生可回复
        if (!currentUserId.equals(consultation.getDoctorId())) {
            throw new BusinessException(ResultCode.FORBIDDEN, "仅接诊医生可回复");
        }
        // 追问次数上限校验
        final int currentReplyCount = consultation.getReplyCount() == null ? 0 : consultation.getReplyCount();
        if (currentReplyCount >= MAX_ASYNC_REPLY_COUNT) {
            throw new BusinessException(ResultCode.CONSULTATION_REPLY_LIMIT);
        }

        // 递增追问次数
        consultation.setReplyCount(currentReplyCount + 1);
        consultationMapper.updateById(consultation);

        // 持久化回复消息
        final ConsultationMessage message = new ConsultationMessage();
        message.setConsultationId(dto.getConsultationId());
        message.setSenderType(ConsultationMessage.SENDER_DOCTOR);
        message.setContentType(ConsultationMessage.CONTENT_TEXT);
        message.setContent(dto.getContent());
        message.setSentAt(LocalDateTime.now());
        message.setReadStatus(0);
        consultationMessageMapper.insert(message);

        final List<ConsultationMessage> singleMessage = Collections.singletonList(message);
        final List<MessageVO> voList = buildMessageVOList(consultation, singleMessage);

        // 集合仅一条元素：刚发送的回复，取第一条即为当前回复
        final MessageVO messageVO = voList.get(0);
        pushWebSocketMessage(dto.getConsultationId(), messageVO);

        logger.info("医生异步回复：consultationId={}, replyCount={}",
                dto.getConsultationId(), currentReplyCount + 1);
        return messageVO;
    }

    /**
     * 关闭问诊会话.
     * <p>
     * 会话的 user 或 doctor 均可关闭。
     * </p>
     *
     * @param consultationId 会话ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void closeConsultation(final Long consultationId) {
        final Long currentUserId = SecurityUtils.getCurrentUserId();
        final Consultation consultation = getConsultationOrThrow(consultationId);
        checkConsultationPermission(consultation, currentUserId);

        consultation.setStatus(Consultation.STATUS_CLOSED);
        consultation.setClosedAt(LocalDateTime.now());
        consultationMapper.updateById(consultation);

        logger.info("关闭问诊会话：consultationId={}, operator={}", consultationId, currentUserId);
    }

    /**
     * 评价问诊会话.
     * <p>
     * 仅会话的患者（user）可评价。
     * </p>
     *
     * @param dto 评价请求
     */
    @Transactional(rollbackFor = Exception.class)
    public void evaluate(final EvaluateDTO dto) {
        final Long currentUserId = SecurityUtils.getCurrentUserId();
        final Consultation consultation = getConsultationOrThrow(dto.getConsultationId());

        // 仅患者可评价
        if (!currentUserId.equals(consultation.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN, "仅问诊患者可评价");
        }

        consultation.setRating(dto.getRating());
        consultation.setRatingComment(dto.getRatingComment());
        consultationMapper.updateById(consultation);

        logger.info("评价问诊会话：consultationId={}, rating={}", dto.getConsultationId(), dto.getRating());
    }

    // ==================== 内部辅助方法 ====================

    /**
     * 根据ID查询问诊会话，不存在则抛异常.
     *
     * @param consultationId 会话ID
     * @return 问诊会话实体
     */
    private Consultation getConsultationOrThrow(final Long consultationId) {
        final Consultation consultation = consultationMapper.selectById(consultationId);
        if (consultation == null) {
            throw new BusinessException(ResultCode.CONSULTATION_NOT_FOUND);
        }
        return consultation;
    }

    /**
     * 校验当前用户是否为会话的 user 或 doctor.
     *
     * @param consultation  问诊会话
     * @param currentUserId 当前用户ID
     */
    private void checkConsultationPermission(final Consultation consultation, final Long currentUserId) {
        if (!currentUserId.equals(consultation.getUserId())
                && !currentUserId.equals(consultation.getDoctorId())) {
            throw new BusinessException(ResultCode.FORBIDDEN, "无权操作该问诊会话");
        }
    }

    /**
     * 检查医生是否在线（Redis）.
     *
     * @param userId 医生用户ID
     * @return true 表示在线
     */
    private boolean isDoctorOnline(final Long userId) {
        final Boolean hasKey = redisTemplate.hasKey(DOCTOR_ONLINE_KEY_PREFIX + userId);
        return Boolean.TRUE.equals(hasKey);
    }

    /**
     * 通过 WebSocket 推送消息到问诊会话订阅者.
     *
     * @param consultationId 会话ID
     * @param messageVO      消息VO
     */
    private void pushWebSocketMessage(final Long consultationId, final MessageVO messageVO) {
        simpMessagingTemplate.convertAndSend(WS_DESTINATION_PREFIX + consultationId, messageVO);
    }

    /**
     * 将问诊列表中每个 VO 的 imagesJson 解析为 images 列表.
     *
     * @param records 问诊VO列表
     */
    private void fillImages(final List<ConsultationVO> records) {
        if (records == null || records.isEmpty()) {
            return;
        }
        for (final ConsultationVO vo : records) {
            vo.setImages(parseImages(vo.getImagesJson()));
        }
    }

    /**
     * 将图片URL列表序列化为 JSON 字符串（存入数据库）.
     *
     * @param images 图片URL列表
     * @return JSON 字符串，空列表返回 null
     */
    private String serializeImages(final List<String> images) {
        if (images == null || images.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(images);
        } catch (final JsonProcessingException e) {
            logger.error("序列化问诊图片JSON失败", e);
            return null;
        }
    }

    /**
     * 将数据库中的 JSON 字符串解析为图片URL列表.
     *
     * @param imagesJson JSON 字符串
     * @return 图片URL列表，空或解析失败返回空列表
     */
    private List<String> parseImages(final String imagesJson) {
        if (StringUtils.isBlank(imagesJson)) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(imagesJson, new TypeReference<List<String>>() {
            });
        } catch (final JsonProcessingException e) {
            logger.error("解析问诊图片JSON失败: {}", imagesJson, e);
            return Collections.emptyList();
        }
    }

    /**
     * 构建消息VO列表（含发送者信息）.
     * <p>
     * 根据会话关联的 userId 和 doctorId 批量查询用户姓名，
     * 按 senderType 填充每条消息的 senderId 和 senderName。
     * </p>
     *
     * @param consultation 问诊会话
     * @param messages     消息实体列表
     * @return 消息VO列表
     */
    private List<MessageVO> buildMessageVOList(final Consultation consultation,
                                                final List<ConsultationMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return Collections.emptyList();
        }

        // 批量查询会话双方姓名，避免逐条查询
        final List<Long> userIds = new ArrayList<>();
        userIds.add(consultation.getUserId());
        userIds.add(consultation.getDoctorId());
        final List<SysUser> users = sysUserMapper.selectBatchIds(userIds);

        final Map<Long, String> nameMap = new HashMap<>();
        for (final SysUser user : users) {
            nameMap.put(user.getId(), user.getName());
        }

        final List<MessageVO> voList = new ArrayList<>();
        for (final ConsultationMessage message : messages) {
            final MessageVO vo = new MessageVO();
            vo.setId(message.getId());
            vo.setConsultationId(message.getConsultationId());
            vo.setSenderType(message.getSenderType());
            vo.setContentType(message.getContentType());
            vo.setContent(message.getContent());
            vo.setSentAt(message.getSentAt());
            vo.setReadStatus(message.getReadStatus());

            // 根据发送者类型推导发送者ID和姓名
            if (ConsultationMessage.SENDER_DOCTOR.equals(message.getSenderType())) {
                vo.setSenderId(consultation.getDoctorId());
                vo.setSenderName(nameMap.get(consultation.getDoctorId()));
            } else {
                vo.setSenderId(consultation.getUserId());
                vo.setSenderName(nameMap.get(consultation.getUserId()));
            }
            voList.add(vo);
        }
        return voList;
    }
}
