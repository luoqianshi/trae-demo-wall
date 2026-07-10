package com.health.module.report.service;

import com.health.common.BusinessException;
import com.health.common.ResultCode;
import com.health.module.family.entity.FamilyMember;
import com.health.module.family.mapper.FamilyMemberMapper;
import com.health.module.health.entity.AdviceTemplate;
import com.health.module.health.entity.AlertRecord;
import com.health.module.health.entity.HealthMetric;
import com.health.module.health.entity.HealthRecord;
import com.health.module.health.mapper.AdviceTemplateMapper;
import com.health.module.health.mapper.AlertRecordMapper;
import com.health.module.health.mapper.HealthMetricMapper;
import com.health.module.health.mapper.HealthRecordMapper;
import com.health.module.report.dto.GenerateReportDTO;
import com.health.module.report.dto.ReportVO;
import com.health.module.report.entity.HealthReport;
import com.health.module.report.mapper.HealthReportMapper;
import com.health.module.user.entity.SysUser;
import com.health.module.user.mapper.SysUserMapper;
import com.health.security.SecurityUtils;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 健康报告服务.
 * <p>
 * 聚合用户在指定周期内的指标记录、异常告警与健康建议，生成 JSON 存入 content 字段，
 * 并使用 PDFBox 生成 PDF 文件。支持报告查询、PDF 下载与家庭成员间分享。
 * 当前用户身份从 SecurityContext 获取，严禁前端传入。
 * </p>
 *
 * @author trae
 * @date 2026-07-10
 */
@Service
public class ReportService {

    /** 日志对象必须为 private static final */
    private static final Logger logger = LoggerFactory.getLogger(ReportService.class);

    /** 报告周期内健康记录查询上限 */
    private static final int RECORD_LIMIT = 500;

    /** 报告周期内异常告警查询上限 */
    private static final int ALERT_LIMIT = 200;

    /** PDF 单行最大字符数（超出截断，避免超出页面宽度） */
    private static final int PDF_LINE_MAX_LENGTH = 60;

    /** PDF 字体大小 */
    private static final float PDF_FONT_SIZE = 12f;

    /** PDF 行距 */
    private static final float PDF_LEADING = 18f;

    /** PDF 页边距 */
    private static final float PDF_MARGIN = 50f;

    /** 报告 PDF 存储子目录 */
    private static final String REPORT_SUB_DIR = "reports";

    /** 日期时间格式化器（复用，线程安全） */
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /** 日期时间格式化器（复用，线程安全） */
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final HealthReportMapper healthReportMapper;

    private final HealthRecordMapper healthRecordMapper;

    private final HealthMetricMapper healthMetricMapper;

    private final AlertRecordMapper alertRecordMapper;

    private final AdviceTemplateMapper adviceTemplateMapper;

    private final SysUserMapper sysUserMapper;

    private final FamilyMemberMapper familyMemberMapper;

    /** ObjectMapper 由 Spring 容器注入，禁止 new ObjectMapper() */
    private final ObjectMapper objectMapper;

    /** 文件上传根路径，从配置 app.upload.path 读取 */
    private final String uploadPath;

    public ReportService(final HealthReportMapper healthReportMapper,
                         final HealthRecordMapper healthRecordMapper,
                         final HealthMetricMapper healthMetricMapper,
                         final AlertRecordMapper alertRecordMapper,
                         final AdviceTemplateMapper adviceTemplateMapper,
                         final SysUserMapper sysUserMapper,
                         final FamilyMemberMapper familyMemberMapper,
                         final ObjectMapper objectMapper,
                         @Value("${app.upload.path}") final String uploadPath) {
        this.healthReportMapper = healthReportMapper;
        this.healthRecordMapper = healthRecordMapper;
        this.healthMetricMapper = healthMetricMapper;
        this.alertRecordMapper = alertRecordMapper;
        this.adviceTemplateMapper = adviceTemplateMapper;
        this.sysUserMapper = sysUserMapper;
        this.familyMemberMapper = familyMemberMapper;
        this.objectMapper = objectMapper;
        this.uploadPath = uploadPath;
    }

    /**
     * 生成健康报告.
     * <p>
     * 聚合周期内指标记录、异常告警与健康建议，序列化为 JSON 存入 content 字段，
     * 随后使用 PDFBox 生成 PDF 文件并更新 file_url。
     * </p>
     *
     * @param dto 生成请求
     * @return 报告ID
     */
    public Long generateReport(final GenerateReportDTO dto) {
        final Long userId = SecurityUtils.getCurrentUserId();

        // 校验报告类型与周期合法性
        validateReportType(dto.getReportType());
        if (dto.getPeriodStart().isAfter(dto.getPeriodEnd())) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "周期开始日期不能晚于结束日期");
        }

        final LocalDateTime startTime = dto.getPeriodStart().atStartOfDay();
        final LocalDateTime endTime = dto.getPeriodEnd().atTime(LocalTime.MAX);

        // 查询用户信息（用于报告标题）
        final SysUser user = sysUserMapper.selectById(userId);
        final String userName = user == null ? "未知用户" : user.getName();

        // 查询周期内健康记录（限制条数）
        final List<HealthRecord> records = healthRecordMapper.findRecordsByPeriod(
                userId, startTime, endTime, RECORD_LIMIT);

        // 查询周期内异常告警记录（限制条数）
        final List<AlertRecord> abnormalAlerts = alertRecordMapper.findAbnormalAlerts(
                userId, startTime, endTime, ALERT_LIMIT);

        // 批量查询涉及的指标信息
        final Map<Long, HealthMetric> metricMap = loadMetricMap(records, abnormalAlerts);

        // 收集异常指标对应的健康建议
        final List<AdviceTemplate> advices = loadAdvices(abnormalAlerts, metricMap);

        // 构建报告内容 JSON
        final Map<String, Object> contentMap = buildContentMap(
                userName, dto, records, abnormalAlerts, metricMap, advices);

        final String contentJson;
        try {
            contentJson = objectMapper.writeValueAsString(contentMap);
        } catch (final IOException e) {
            // 序列化失败属于系统异常，保留原始 cause
            logger.error("报告内容JSON序列化失败: userId={}", userId, e);
            throw new BusinessException(ResultCode.SYSTEM_ERROR, "报告内容序列化失败", e);
        }

        // 持久化报告（先存 content，再生成 PDF 更新 file_url）
        final HealthReport report = new HealthReport();
        report.setUserId(userId);
        report.setPeriodStart(dto.getPeriodStart());
        report.setPeriodEnd(dto.getPeriodEnd());
        report.setReportType(dto.getReportType());
        report.setContent(contentJson);
        healthReportMapper.insert(report);

        // 生成 PDF 文件并更新 file_url
        final String relativePath = generatePdfFile(report, contentMap);
        report.setFileUrl(relativePath);
        healthReportMapper.updateById(report);

        logger.info("健康报告生成成功: userId={}, reportId={}", userId, report.getId());
        return report.getId();
    }

    /**
     * 查询当前用户的报告列表.
     *
     * @return 报告信息列表
     */
    public List<ReportVO> getMyReports() {
        final Long userId = SecurityUtils.getCurrentUserId();
        final List<HealthReport> reports = healthReportMapper.findByUserId(userId);

        final List<ReportVO> voList = new ArrayList<>();
        for (final HealthReport report : reports) {
            // 显式赋值，禁止反射拷贝；列表不含大字段 content
            final ReportVO vo = new ReportVO();
            vo.setId(report.getId());
            vo.setReportType(report.getReportType());
            vo.setPeriodStart(report.getPeriodStart());
            vo.setPeriodEnd(report.getPeriodEnd());
            vo.setFileUrl(report.getFileUrl());
            vo.setCreatedAt(report.getCreatedAt());
            voList.add(vo);
        }
        return voList;
    }

    /**
     * 下载报告 PDF.
     * <p>
     * 校验报告归属后返回文件流，Content-Disposition 同时包含 filename 与 filename*
     * （RFC 5987，URL 编码中文文件名）。
     * </p>
     *
     * @param reportId 报告ID
     * @return 包含 PDF 文件流的响应实体
     */
    public ResponseEntity<Resource> downloadReport(final Long reportId) {
        final Long userId = SecurityUtils.getCurrentUserId();

        final HealthReport report = healthReportMapper.selectById(reportId);
        if (report == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "报告不存在");
        }
        // 校验归属：仅报告所有者可下载
        if (!userId.equals(report.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN, "无权下载他人报告");
        }
        if (report.getFileUrl() == null || report.getFileUrl().isBlank()) {
            throw new BusinessException(ResultCode.FILE_UPLOAD_ERROR, "报告PDF尚未生成");
        }

        final Path uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();
        final Path filePath = uploadDir.resolve(report.getFileUrl()).normalize();
        // 防止路径穿越：解析后路径必须在上传根目录内
        if (!filePath.startsWith(uploadDir)) {
            throw new BusinessException(ResultCode.FORBIDDEN, "非法文件路径");
        }
        if (!Files.exists(filePath)) {
            throw new BusinessException(ResultCode.NOT_FOUND, "报告PDF文件不存在");
        }

        final Resource resource = new FileSystemResource(filePath);

        // 构建下载文件名：健康报告_类型_周期
        final String filename = "健康报告_" + report.getReportType() + "_"
                + report.getPeriodStart().format(DATE_FMT) + ".pdf";
        // filename 部分：ASCII 兜底（非 ASCII 替换为下划线，兼容旧客户端）
        final String asciiFilename = filename.replaceAll("[^\\x20-\\x7E]", "_");
        // filename* 部分：RFC 5987 编码（支持中文）
        final String encodedFilename = URLEncoder.encode(filename, StandardCharsets.UTF_8)
                .replace("+", "%20");

        final HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + asciiFilename + "\"; filename*=UTF-8''" + encodedFilename);
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentLength(filePath.toFile().length());

        return new ResponseEntity<>(resource, headers, HttpStatus.OK);
    }

    /**
     * 分享报告给家庭成员.
     * <p>
     * 校验当前用户与目标用户属于同一家庭组后，创建报告副本给目标用户
     * （目标用户可在自己的报告列表中查看与下载）。
     * </p>
     *
     * @param reportId     报告ID
     * @param targetUserId 目标用户ID
     */
    public void shareReport(final Long reportId, final Long targetUserId) {
        final Long userId = SecurityUtils.getCurrentUserId();

        final HealthReport report = healthReportMapper.selectById(reportId);
        if (report == null) {
            throw new BusinessException(ResultCode.NOT_FOUND, "报告不存在");
        }
        // 校验归属：仅报告所有者可分享
        if (!userId.equals(report.getUserId())) {
            throw new BusinessException(ResultCode.FORBIDDEN, "无权分享他人报告");
        }

        // 校验家庭组关系：当前用户与目标用户须在同一家庭组
        validateFamilyRelationship(userId, targetUserId);

        // 创建报告副本给目标用户（复用同一 PDF 文件）
        final HealthReport shared = new HealthReport();
        shared.setUserId(targetUserId);
        shared.setPeriodStart(report.getPeriodStart());
        shared.setPeriodEnd(report.getPeriodEnd());
        shared.setReportType(report.getReportType());
        shared.setContent(report.getContent());
        shared.setFileUrl(report.getFileUrl());
        healthReportMapper.insert(shared);

        logger.info("报告分享成功: from={}, to={}, reportId={}", userId, targetUserId, reportId);
    }

    // ==================== 私有辅助方法 ====================

    /**
     * 校验报告类型是否合法.
     */
    private void validateReportType(final String reportType) {
        if (!HealthReport.TYPE_WEEKLY.equals(reportType)
                && !HealthReport.TYPE_MONTHLY.equals(reportType)
                && !HealthReport.TYPE_CUSTOM.equals(reportType)) {
            throw new BusinessException(ResultCode.PARAM_ERROR, "报告类型不合法");
        }
    }

    /**
     * 批量加载指标信息.
     * <p>
     * 汇总记录与告警中的 metricId，去重后批量查询，避免循环内逐条查询。
     * </p>
     */
    private Map<Long, HealthMetric> loadMetricMap(final List<HealthRecord> records,
                                                   final List<AlertRecord> alerts) {
        final Set<Long> metricIds = new LinkedHashSet<>();
        for (final HealthRecord record : records) {
            metricIds.add(record.getMetricId());
        }
        for (final AlertRecord alert : alerts) {
            metricIds.add(alert.getMetricId());
        }
        if (metricIds.isEmpty()) {
            return Map.of();
        }
        final List<HealthMetric> metrics = healthMetricMapper.selectBatchIds(metricIds);
        return metrics.stream()
                .collect(Collectors.toMap(HealthMetric::getId, m -> m, (a, b) -> b));
    }

    /**
     * 根据异常告警匹配健康建议模板.
     */
    private List<AdviceTemplate> loadAdvices(final List<AlertRecord> alerts,
                                              final Map<Long, HealthMetric> metricMap) {
        final List<AdviceTemplate> advices = new ArrayList<>();
        final Set<Long> usedTemplateIds = new LinkedHashSet<>();
        for (final AlertRecord alert : alerts) {
            final AdviceTemplate advice = adviceTemplateMapper.findByMetricAndLevel(
                    alert.getMetricId(), alert.getLevel());
            // 集合只取一个元素：每个指标每个等级仅取一条建议模板（业务上唯一）
            if (advice != null && usedTemplateIds.add(advice.getId())) {
                advices.add(advice);
            }
        }

        // 无匹配建议时取通用建议兜底
        if (advices.isEmpty() && !alerts.isEmpty()) {
            final AdviceTemplate general = adviceTemplateMapper.findGeneralAdvice(AlertRecord.LEVEL_WARNING);
            if (general != null) {
                advices.add(general);
            }
        }
        return advices;
    }

    /**
     * 构建报告内容 Map（后续序列化为 JSON）.
     */
    private Map<String, Object> buildContentMap(final String userName,
                                                  final GenerateReportDTO dto,
                                                  final List<HealthRecord> records,
                                                  final List<AlertRecord> abnormalAlerts,
                                                  final Map<Long, HealthMetric> metricMap,
                                                  final List<AdviceTemplate> advices) {
        final Map<String, Object> content = new LinkedHashMap<>();
        content.put("userName", userName);
        content.put("reportType", dto.getReportType());
        content.put("periodStart", dto.getPeriodStart().format(DATE_FMT));
        content.put("periodEnd", dto.getPeriodEnd().format(DATE_FMT));
        content.put("generatedAt", LocalDateTime.now().format(DATETIME_FMT));

        // 指标记录列表
        final List<Map<String, Object>> metricList = new ArrayList<>();
        for (final HealthRecord record : records) {
            final HealthMetric metric = metricMap.get(record.getMetricId());
            final Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", metric == null ? "未知指标" : metric.getName());
            item.put("value", record.getValue());
            item.put("unit", record.getUnit());
            item.put("recordedAt", record.getRecordedAt().format(DATETIME_FMT));
            metricList.add(item);
        }
        content.put("metrics", metricList);

        // 异常项列表
        final List<Map<String, Object>> abnormalList = new ArrayList<>();
        for (final AlertRecord alert : abnormalAlerts) {
            final HealthMetric metric = metricMap.get(alert.getMetricId());
            final Map<String, Object> item = new LinkedHashMap<>();
            item.put("name", metric == null ? "未知指标" : metric.getName());
            item.put("value", alert.getValue());
            item.put("level", alert.getLevel());
            item.put("createdAt", alert.getCreatedAt().format(DATETIME_FMT));
            abnormalList.add(item);
        }
        content.put("abnormalItems", abnormalList);

        // 健康建议列表
        final List<Map<String, Object>> adviceList = new ArrayList<>();
        for (final AdviceTemplate advice : advices) {
            final Map<String, Object> item = new LinkedHashMap<>();
            item.put("title", advice.getTitle());
            item.put("content", advice.getContent());
            adviceList.add(item);
        }
        content.put("advices", adviceList);

        return content;
    }

    /**
     * 校验当前用户与目标用户是否属于同一家庭组.
     */
    private void validateFamilyRelationship(final Long userId, final Long targetUserId) {
        final List<FamilyMember> myMemberships = familyMemberMapper.findByUserId(userId);
        final List<FamilyMember> targetMemberships = familyMemberMapper.findByUserId(targetUserId);

        final Set<Long> myGroupIds = myMemberships.stream()
                .map(FamilyMember::getGroupId).collect(Collectors.toSet());
        final boolean inSameGroup = targetMemberships.stream()
                .anyMatch(m -> myGroupIds.contains(m.getGroupId()));

        if (!inSameGroup) {
            throw new BusinessException(ResultCode.FORBIDDEN, "只能分享给同一家庭成员");
        }
    }

    // ==================== PDF 生成 ====================

    /**
     * 生成 PDF 文件并返回相对路径.
     * <p>
     * 使用 PDFBox 将报告内容渲染为 PDF，存储到 {app.upload.path}/reports/ 目录。
     * PDDocument 与内容流均在 try-with-resources 中关闭，确保资源释放。
     * </p>
     *
     * @param report     报告实体（含 ID）
     * @param contentMap 报告内容数据
     * @return PDF 文件相对路径（相对于上传根目录）
     */
    private String generatePdfFile(final HealthReport report, final Map<String, Object> contentMap) {
        final Path uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();
        final Path reportDir = uploadDir.resolve(REPORT_SUB_DIR);
        final String fileName = "report_" + report.getId() + ".pdf";
        final Path filePath = reportDir.resolve(fileName);
        final String relativePath = REPORT_SUB_DIR + "/" + fileName;

        final List<String> lines = buildPdfLines(contentMap);

        try (final PDDocument doc = new PDDocument()) {
            Files.createDirectories(reportDir);
            final PDFont font = loadReportFont(doc);
            final boolean cjkAvailable = !(font instanceof PDType1Font);
            writePdfLines(doc, font, lines, cjkAvailable);
            doc.save(filePath.toFile());
        } catch (final IOException e) {
            // PDF 生成失败保留原始 cause
            logger.error("PDF生成失败: reportId={}", report.getId(), e);
            throw new BusinessException(ResultCode.FILE_UPLOAD_ERROR, "报告PDF生成失败", e);
        }

        logger.info("PDF生成成功: reportId={}, path={}", report.getId(), relativePath);
        return relativePath;
    }

    /**
     * 加载报告字体.
     * <p>
     * 优先尝试加载支持中文的 TTF 字体；未找到则回退到 Helvetica（标准14字体），
     * 此时中文将以占位符显示（已记录告警日志）。
     * </p>
     *
     * @param doc PDF 文档
     * @return 字体对象
     */
    private PDFont loadReportFont(final PDDocument doc) {
        // 候选系统 CJK 字体路径（运行时资源发现，非应用配置）
        final List<String> candidateFontPaths = List.of(
                "C:\\Windows\\Fonts\\simhei.ttf",
                "C:\\Windows\\Fonts\\msyhbd.ttf");
        for (final String path : candidateFontPaths) {
            final Path fontPath = Paths.get(path);
            if (Files.exists(fontPath)) {
                try {
                    return PDType0Font.load(doc, fontPath.toFile());
                } catch (final IOException e) {
                    logger.warn("加载中文字体失败，将尝试下一个或回退默认字体: path={}", path, e);
                }
            }
        }
        logger.warn("未找到中文字体，PDF中文可能无法正常渲染，回退使用Helvetica");
        return new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    }

    /**
     * 将文本行写入 PDF（自动分页）.
     *
     * @param doc          PDF 文档
     * @param font         字体
     * @param lines        文本行
     * @param cjkAvailable 是否支持中文（不支持时对非 ASCII 字符做替换避免编码异常）
     */
    private void writePdfLines(final PDDocument doc, final PDFont font, final List<String> lines,
                                final boolean cjkAvailable) throws IOException {
        final float pageHeight = PDRectangle.A4.getHeight();
        float y = pageHeight - PDF_MARGIN;
        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);
        PDPageContentStream stream = new PDPageContentStream(
                doc, page, PDPageContentStream.AppendMode.OVERWRITE, true);
        stream.setFont(font, PDF_FONT_SIZE);

        try {
            for (final String rawLine : lines) {
                if (y < PDF_MARGIN) {
                    // 当前页已满，新建页面
                    stream.close();
                    page = new PDPage(PDRectangle.A4);
                    doc.addPage(page);
                    stream = new PDPageContentStream(
                            doc, page, PDPageContentStream.AppendMode.OVERWRITE, true);
                    stream.setFont(font, PDF_FONT_SIZE);
                    y = pageHeight - PDF_MARGIN;
                }
                final String line = sanitizeText(rawLine, cjkAvailable);
                stream.beginText();
                stream.newLineAtOffset(PDF_MARGIN, y);
                stream.showText(line);
                stream.endText();
                y -= PDF_LEADING;
            }
        } finally {
            // 确保最后一个内容流被关闭
            stream.close();
        }
    }

    /**
     * 构建 PDF 文本行列表.
     */
    @SuppressWarnings("unchecked")
    private List<String> buildPdfLines(final Map<String, Object> contentMap) {
        final List<String> lines = new ArrayList<>();
        lines.add("健康报告 (Health Report)");
        lines.add("用户: " + contentMap.get("userName"));
        lines.add("类型: " + contentMap.get("reportType"));
        lines.add("周期: " + contentMap.get("periodStart") + " ~ " + contentMap.get("periodEnd"));
        lines.add("生成时间: " + contentMap.get("generatedAt"));
        lines.add("");

        lines.add("【指标概览】");
        final List<Map<String, Object>> metrics = (List<Map<String, Object>>) contentMap.get("metrics");
        for (final Map<String, Object> metric : metrics) {
            final String line = "  " + metric.get("name") + ": " + metric.get("value")
                    + metric.get("unit") + "  (" + metric.get("recordedAt") + ")";
            lines.add(truncateLine(line));
        }
        lines.add("");

        lines.add("【异常项】");
        final List<Map<String, Object>> abnormals = (List<Map<String, Object>>) contentMap.get("abnormalItems");
        if (abnormals.isEmpty()) {
            lines.add("  无异常项");
        } else {
            for (final Map<String, Object> abnormal : abnormals) {
                final String line = "  " + abnormal.get("name") + "=" + abnormal.get("value")
                        + "  [" + abnormal.get("level") + "]";
                lines.add(truncateLine(line));
            }
        }
        lines.add("");

        lines.add("【健康建议】");
        final List<Map<String, Object>> advices = (List<Map<String, Object>>) contentMap.get("advices");
        if (advices.isEmpty()) {
            lines.add("  暂无建议");
        } else {
            for (final Map<String, Object> advice : advices) {
                lines.add(truncateLine("  - " + advice.get("title")));
            }
        }
        return lines;
    }

    /**
     * 截断超长行，避免超出 PDF 页面宽度.
     */
    private String truncateLine(final String line) {
        if (line == null) {
            return "";
        }
        if (line.length() <= PDF_LINE_MAX_LENGTH) {
            return line;
        }
        return line.substring(0, PDF_LINE_MAX_LENGTH) + "...";
    }

    /**
     * 文本净化：无中文字体时将非 ASCII 字符替换为占位符，避免 WinAnsi 编码异常.
     */
    private String sanitizeText(final String text, final boolean cjkAvailable) {
        if (text == null) {
            return "";
        }
        if (cjkAvailable) {
            return text;
        }
        final StringBuilder sb = new StringBuilder(text.length());
        for (int i = 0; i < text.length(); i++) {
            final char c = text.charAt(i);
            if (c <= 127) {
                sb.append(c);
            } else {
                sb.append('?');
            }
        }
        return sb.toString();
    }
}
