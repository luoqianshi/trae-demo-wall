package com.ice.template.rag.douyin;

import cn.hutool.core.util.URLUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONUtil;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.service.SystemSettingService;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class DouyinApiClient {

    private static final String DOUYIN_API_HOST = "https://www.douyin.com/aweme/v1/web";

    @Value("${douyin.cookie:}")
    private String cookie;

    @Value("${douyin.user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36}")
    private String userAgent;

    @Resource
    private ABogusSigner aBogusSigner;

    @Resource
    private SystemSettingService systemSettingService;

    public DouyinVideoInfo resolveVideo(String input) {
        String sourceUrl = DouyinLinkUtils.extractUrl(input);
        if (StringUtils.isBlank(sourceUrl)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "未识别到有效抖音链接");
        }
        String awemeId = resolveAwemeId(sourceUrl);
        DouyinVideoInfo videoInfo = getVideoDetail(awemeId);
        if (videoInfo == null || StringUtils.isBlank(videoInfo.getVideoUrl())) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "抖音视频解析失败，未获取到视频地址");
        }
        return videoInfo;
    }

    public String resolveSourceUrl(String input) {
        String sourceUrl = DouyinLinkUtils.extractUrl(input);
        if (StringUtils.isBlank(sourceUrl)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "未识别到有效抖音链接");
        }
        return sourceUrl;
    }

    public Map<String, String> buildVideoDownloadHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("User-Agent", userAgent);
        headers.put("Referer", "https://www.douyin.com/");
        return headers;
    }

    private String resolveAwemeId(String sourceUrl) {
        String directAwemeId = DouyinLinkUtils.extractAwemeId(sourceUrl);
        if (StringUtils.isNotBlank(directAwemeId)) {
            return directAwemeId;
        }
        String redirected = resolveRedirectUrl(sourceUrl);
        String awemeId = DouyinLinkUtils.extractAwemeId(redirected);
        if (StringUtils.isBlank(awemeId)) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "无法从抖音链接解析视频 ID");
        }
        return awemeId;
    }

    private String resolveRedirectUrl(String sourceUrl) {
        try {
            HttpURLConnection connection = (HttpURLConnection) new URL(sourceUrl).openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(15000);
            connection.setRequestProperty("User-Agent", userAgent);
            String effectiveCookie = getEffectiveCookie();
            if (StringUtils.isNotBlank(effectiveCookie)) {
                connection.setRequestProperty("Cookie", effectiveCookie);
            }
            int status = connection.getResponseCode();
            String location = connection.getHeaderField("Location");
            if (status >= 300 && status < 400 && StringUtils.isNotBlank(location)) {
                return URI.create(sourceUrl).resolve(location).toString();
            }
            return connection.getURL().toString();
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "解析抖音短链失败: " + e.getMessage());
        }
    }

    private DouyinVideoInfo getVideoDetail(String awemeId) {
        try {
            Map<String, String> params = new LinkedHashMap<>();
            params.put("aweme_id", awemeId);
            String response = sendRequest(DOUYIN_API_HOST + "/aweme/detail/", params);
            Map<String, Object> jsonMap = JSONUtil.parseObj(response);
            Object statusCode = jsonMap.get("status_code");
            if (statusCode == null || (!"0".equals(String.valueOf(statusCode)) && !"success".equals(String.valueOf(statusCode)))) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "抖音接口返回异常: " + jsonMap.get("message"));
            }
            Object awemeDetailObj = jsonMap.get("aweme_detail");
            if (!(awemeDetailObj instanceof Map<?, ?> awemeDetail)) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "抖音接口未返回视频详情");
            }
            DouyinVideoInfo videoInfo = buildVideoResponse((Map<String, Object>) awemeDetail);
            videoInfo.setRawData(response);
            return videoInfo;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "获取抖音视频详情失败: " + e.getMessage());
        }
    }

    private String sendRequest(String endpoint, Map<String, String> params) {
        params.put("device_platform", "webapp");
        params.put("aid", "6383");
        params.put("channel", "channel_pc_web");
        params.put("update_version_code", "170400");
        params.put("pc_client_type", "1");
        params.put("version_code", "170400");
        params.put("version_name", "17.4.0");
        params.put("cookie_enabled", "true");
        params.put("screen_width", "1920");
        params.put("screen_height", "1080");
        params.put("browser_language", "zh-CN");
        params.put("browser_platform", "Win32");
        params.put("browser_name", "Chrome");
        params.put("browser_version", "120.0.0.0");
        String paramString = buildParamString(params);
        String sign = aBogusSigner.generateABogus(paramString, "GET");
        String fullUrl = endpoint + "?" + paramString + "&a_bogus=" + URLUtil.encodeAll(sign, StandardCharsets.UTF_8);
        HttpRequest request = HttpRequest.get(fullUrl)
                .timeout(30000)
                .header("User-Agent", userAgent)
                .header("Referer", "https://www.douyin.com/");
        String effectiveCookie = getEffectiveCookie();
        if (StringUtils.isNotBlank(effectiveCookie)) {
            request.header("Cookie", effectiveCookie);
        }
        try (HttpResponse response = request.execute()) {
            if (!response.isOk()) {
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "抖音接口请求失败，HTTP " + response.getStatus());
            }
            return response.body();
        }
    }

    private String getEffectiveCookie() {
        String settingCookie = systemSettingService.getValue(SystemSettingService.DOUYIN_COOKIE_KEY);
        if (StringUtils.isNotBlank(settingCookie)) {
            return settingCookie;
        }
        return StringUtils.trimToNull(cookie);
    }

    private String buildParamString(Map<String, String> params) {
        StringBuilder builder = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (builder.length() > 0) {
                builder.append("&");
            }
            builder.append(entry.getKey())
                    .append("=")
                    .append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
        }
        return builder.toString();
    }

    @SuppressWarnings("unchecked")
    private DouyinVideoInfo buildVideoResponse(Map<String, Object> aweme) {
        DouyinVideoInfo.DouyinVideoInfoBuilder builder = DouyinVideoInfo.builder();
        builder.awemeId(String.valueOf(aweme.get("aweme_id")));
        builder.desc(String.valueOf(aweme.get("desc")));
        Object createTime = aweme.get("create_time");
        if (createTime != null) {
            builder.createTime(Long.valueOf(String.valueOf(createTime)));
        }
        Map<String, Object> authorMap = (Map<String, Object>) aweme.get("author");
        if (authorMap != null) {
            builder.author(buildAuthorInfo(authorMap));
        }
        Map<String, Object> statisticsMap = (Map<String, Object>) aweme.get("statistics");
        if (statisticsMap != null) {
            builder.statistics(buildVideoStatistics(statisticsMap));
        }
        Map<String, Object> videoMap = (Map<String, Object>) aweme.get("video");
        if (videoMap != null) {
            extractVideoFields(builder, videoMap);
        }
        Object imagePost = aweme.get("image_post_info");
        builder.imagePost(imagePost != null);
        return builder.build();
    }

    @SuppressWarnings("unchecked")
    private void extractVideoFields(DouyinVideoInfo.DouyinVideoInfoBuilder builder, Map<String, Object> videoMap) {
        Map<String, Object> playAddr = (Map<String, Object>) videoMap.get("play_addr");
        if (playAddr != null) {
            Object downloadAddr = playAddr.get("download_addr");
            String videoUrl = firstListValue(downloadAddr);
            if (StringUtils.isBlank(videoUrl)) {
                videoUrl = firstListValue(playAddr.get("url_list"));
            }
            if (StringUtils.isNotBlank(videoUrl)) {
                builder.videoUrl(videoUrl);
            }
        }
        String directDownloadUrl = firstListValue(videoMap.get("download_addr"));
        if (StringUtils.isNotBlank(directDownloadUrl)) {
            builder.videoUrl(directDownloadUrl);
        }
        Map<String, Object> cover = (Map<String, Object>) videoMap.get("cover");
        if (cover != null) {
            builder.videoCover(firstListValue(cover.get("url_list")));
        }
        Object duration = videoMap.get("duration");
        if (duration != null) {
            builder.duration(Long.valueOf(String.valueOf(duration)));
        }
    }

    private String firstListValue(Object value) {
        if (value instanceof List<?> list && !list.isEmpty()) {
            Object first = list.get(0);
            return first == null ? null : String.valueOf(first);
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private DouyinAuthorInfo buildAuthorInfo(Map<String, Object> authorMap) {
        String avatarUrl = null;
        Map<String, Object> avatarThumb = (Map<String, Object>) authorMap.get("avatar_thumb");
        if (avatarThumb != null) {
            avatarUrl = firstListValue(avatarThumb.get("url_list"));
        }
        return DouyinAuthorInfo.builder()
                .uid(value(authorMap.get("uid")))
                .secUid(value(authorMap.get("sec_uid")))
                .nickname(value(authorMap.get("nickname")))
                .uniqueId(value(authorMap.get("unique_id")))
                .shortId(value(authorMap.get("short_id")))
                .signature(value(authorMap.get("signature")))
                .avatarUrl(avatarUrl)
                .build();
    }

    private DouyinVideoStatistics buildVideoStatistics(Map<String, Object> statsMap) {
        return DouyinVideoStatistics.builder()
                .diggCount(longValue(statsMap.get("digg_count")))
                .commentCount(longValue(statsMap.get("comment_count")))
                .collectCount(longValue(statsMap.get("collect_count")))
                .shareCount(longValue(statsMap.get("share_count")))
                .playCount(longValue(statsMap.get("play_count")))
                .build();
    }

    private Long longValue(Object value) {
        if (value == null) {
            return null;
        }
        return Long.valueOf(String.valueOf(value));
    }

    private String value(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
