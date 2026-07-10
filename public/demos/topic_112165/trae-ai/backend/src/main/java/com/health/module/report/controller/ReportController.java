package com.health.module.report.controller;

import com.health.common.Result;
import com.health.module.report.dto.GenerateReportDTO;
import com.health.module.report.dto.ReportVO;
import com.health.module.report.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 健康报告接口.
 * <p>
 * 提供报告生成、查询、PDF 下载与家庭成员分享功能。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(final ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * 生成健康报告.
     *
     * @param dto 生成请求
     * @return 报告ID
     */
    @PostMapping("/generate")
    public Result<Long> generate(@Valid @RequestBody final GenerateReportDTO dto) {
        return Result.success(reportService.generateReport(dto));
    }

    /**
     * 查询当前用户的报告列表.
     *
     * @return 报告信息列表
     */
    @GetMapping("/mine")
    public Result<List<ReportVO>> mine() {
        return Result.success(reportService.getMyReports());
    }

    /**
     * 下载报告 PDF.
     * <p>
     * 返回 PDF 文件流，Content-Disposition 同时含 filename 与 filename*（RFC 5987）。
     * </p>
     *
     * @param id 报告ID
     * @return PDF 文件流响应
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable final Long id) {
        return reportService.downloadReport(id);
    }

    /**
     * 分享报告给家庭成员.
     *
     * @param id           报告ID
     * @param targetUserId 目标用户ID
     * @return 操作结果
     */
    @PostMapping("/{id}/share")
    public Result<Void> share(@PathVariable final Long id,
                              @RequestParam final Long targetUserId) {
        reportService.shareReport(id, targetUserId);
        return Result.success();
    }
}
