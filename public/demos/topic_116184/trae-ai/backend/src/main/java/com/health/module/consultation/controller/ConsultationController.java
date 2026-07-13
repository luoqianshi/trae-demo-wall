package com.health.module.consultation.controller;

import com.health.common.PageResult;
import com.health.common.Result;
import com.health.module.consultation.dto.ConsultationVO;
import com.health.module.consultation.dto.DoctorVO;
import com.health.module.consultation.dto.EvaluateDTO;
import com.health.module.consultation.dto.MessageVO;
import com.health.module.consultation.dto.ReplyDTO;
import com.health.module.consultation.dto.SendMessageDTO;
import com.health.module.consultation.dto.StartConsultationDTO;
import com.health.module.consultation.service.ConsultationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 问诊会话接口.
 * <p>
 * 提供在线医生查询、问诊发起、消息收发、异步回复、会话关闭与评价等功能。
 * 当前用户身份从 SecurityContext 获取，前端无需也无法传入 userId。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {

    private final ConsultationService consultationService;

    public ConsultationController(final ConsultationService consultationService) {
        this.consultationService = consultationService;
    }

    /**
     * 查询在线医生列表.
     *
     * @return 医生列表（含在线标记）
     */
    @GetMapping("/doctors/online")
    public Result<List<DoctorVO>> getOnlineDoctors() {
        return Result.success(consultationService.getOnlineDoctors());
    }

    /**
     * 发起问诊会话.
     *
     * @param dto 发起问诊请求
     * @return 创建的会话ID
     */
    @PostMapping
    public Result<Long> startConsultation(@Valid @RequestBody final StartConsultationDTO dto) {
        return Result.success(consultationService.startConsultation(dto));
    }

    /**
     * 查询当前用户的问诊列表（分页）.
     *
     * @param page 页码（默认1）
     * @param size 每页条数（默认10）
     * @return 分页结果
     */
    @GetMapping("/mine")
    public Result<PageResult<ConsultationVO>> getMyConsultations(
            @RequestParam(defaultValue = "1") final int page,
            @RequestParam(defaultValue = "10") final int size) {
        return Result.success(consultationService.getMyConsultations(page, size));
    }

    /**
     * 查询当前医生的接诊列表（分页）.
     *
     * @param page 页码（默认1）
     * @param size 每页条数（默认10）
     * @return 分页结果
     */
    @GetMapping("/doctor")
    public Result<PageResult<ConsultationVO>> getDoctorConsultations(
            @RequestParam(defaultValue = "1") final int page,
            @RequestParam(defaultValue = "10") final int size) {
        return Result.success(consultationService.getDoctorConsultations(page, size));
    }

    /**
     * 查询问诊历史消息.
     *
     * @param id 会话ID
     * @return 消息列表（含发送者信息）
     */
    @GetMapping("/{id}/messages")
    public Result<List<MessageVO>> getMessages(@PathVariable final Long id) {
        return Result.success(consultationService.getMessages(id));
    }

    /**
     * 发送问诊消息.
     *
     * @param dto 发送消息请求
     * @return 消息VO（含发送者信息）
     */
    @PostMapping("/messages")
    public Result<MessageVO> sendMessage(@Valid @RequestBody final SendMessageDTO dto) {
        return Result.success(consultationService.sendMessage(dto));
    }

    /**
     * 医生异步回复.
     *
     * @param dto 异步回复请求
     * @return 消息VO（含发送者信息）
     */
    @PostMapping("/reply")
    public Result<MessageVO> replyAsync(@Valid @RequestBody final ReplyDTO dto) {
        return Result.success(consultationService.replyAsync(dto));
    }

    /**
     * 关闭问诊会话.
     *
     * @param id 会话ID
     * @return 成功响应
     */
    @PostMapping("/{id}/close")
    public Result<Void> closeConsultation(@PathVariable final Long id) {
        consultationService.closeConsultation(id);
        return Result.success();
    }

    /**
     * 评价问诊会话.
     *
     * @param dto 评价请求
     * @return 成功响应
     */
    @PostMapping("/evaluate")
    public Result<Void> evaluate(@Valid @RequestBody final EvaluateDTO dto) {
        consultationService.evaluate(dto);
        return Result.success();
    }
}
