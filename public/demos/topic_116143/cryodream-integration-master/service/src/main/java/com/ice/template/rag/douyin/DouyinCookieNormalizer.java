package com.ice.template.rag.douyin;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONUtil;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

@Component
public class DouyinCookieNormalizer {

    public String normalize(String raw) {
        if (StringUtils.isBlank(raw)) {
            return "";
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
            return normalizeJson(trimmed);
        }
        return normalizeHeader(trimmed);
    }

    public int countCookies(String cookieHeader) {
        if (StringUtils.isBlank(cookieHeader)) {
            return 0;
        }
        return (int) parseHeader(cookieHeader).entrySet().stream()
                .filter(entry -> StringUtils.isNotBlank(entry.getKey()) && StringUtils.isNotBlank(entry.getValue()))
                .count();
    }

    public String mask(String cookieHeader) {
        if (StringUtils.isBlank(cookieHeader)) {
            return "";
        }
        Map<String, String> cookies = parseHeader(cookieHeader);
        return cookies.entrySet().stream()
                .limit(8)
                .map(entry -> entry.getKey() + "=" + maskValue(entry.getValue()))
                .collect(Collectors.joining("; "));
    }

    private String normalizeJson(String json) {
        try {
            Object parsed = JSONUtil.parse(json);
            List<String> pairs = new ArrayList<>();
            if (parsed instanceof JSONArray array) {
                for (Object item : array) {
                    appendJsonCookie(pairs, item);
                }
            } else {
                appendJsonCookie(pairs, parsed);
            }
            if (pairs.isEmpty()) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "未在 JSON 中识别到有效 Cookie");
            }
            return String.join("; ", pairs);
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "Cookie JSON 格式无法解析");
        }
    }

    private void appendJsonCookie(List<String> pairs, Object item) {
        if (!(item instanceof Map<?, ?> map)) {
            return;
        }
        Object name = map.get("name");
        Object value = map.get("value");
        if (name == null || value == null) {
            return;
        }
        String cookieName = String.valueOf(name).trim();
        String cookieValue = String.valueOf(value).trim();
        if (StringUtils.isAnyBlank(cookieName, cookieValue)) {
            return;
        }
        pairs.add(cookieName + "=" + cookieValue);
    }

    private String normalizeHeader(String header) {
        Map<String, String> cookies = parseHeader(header);
        if (cookies.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "未识别到有效 Cookie");
        }
        return cookies.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("; "));
    }

    private Map<String, String> parseHeader(String header) {
        Map<String, String> cookies = new LinkedHashMap<>();
        if (StringUtils.isBlank(header)) {
            return cookies;
        }
        String[] parts = header.replace("\r", "").replace("\n", ";").split(";");
        for (String part : parts) {
            String item = part.trim();
            if (StringUtils.isBlank(item)) {
                continue;
            }
            int index = item.indexOf('=');
            if (index <= 0) {
                continue;
            }
            String name = item.substring(0, index).trim();
            String value = item.substring(index + 1).trim();
            if (StringUtils.isAnyBlank(name, value)) {
                continue;
            }
            if (isCookieAttribute(name)) {
                continue;
            }
            cookies.put(name, value);
        }
        return cookies;
    }

    private boolean isCookieAttribute(String name) {
        String lower = name.toLowerCase();
        return "path".equals(lower)
                || "domain".equals(lower)
                || "expires".equals(lower)
                || "max-age".equals(lower)
                || "samesite".equals(lower)
                || "secure".equals(lower)
                || "httponly".equals(lower);
    }

    private String maskValue(String value) {
        if (StringUtils.isBlank(value)) {
            return "";
        }
        if (value.length() <= 8) {
            return "••••";
        }
        return value.substring(0, 4) + "••••" + value.substring(value.length() - 4);
    }
}
