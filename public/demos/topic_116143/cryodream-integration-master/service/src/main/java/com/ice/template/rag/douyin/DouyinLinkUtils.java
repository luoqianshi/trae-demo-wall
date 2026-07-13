package com.ice.template.rag.douyin;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.apache.commons.lang3.StringUtils;

public final class DouyinLinkUtils {

    private static final Pattern URL_PATTERN = Pattern.compile("https?://[^\\s\\u4e00-\\u9fa5]+", Pattern.CASE_INSENSITIVE);

    private static final Pattern VIDEO_ID_PATTERN = Pattern.compile("/video/(\\d+)");

    private DouyinLinkUtils() {
    }

    public static String extractUrl(String text) {
        if (StringUtils.isBlank(text)) {
            return null;
        }
        Matcher matcher = URL_PATTERN.matcher(text);
        while (matcher.find()) {
            String url = matcher.group();
            url = trimUrl(url);
            if (isDouyinUrl(url)) {
                return url;
            }
        }
        return null;
    }

    public static boolean isDouyinUrl(String url) {
        if (StringUtils.isBlank(url)) {
            return false;
        }
        String lower = url.toLowerCase();
        return lower.contains("douyin.com") || lower.contains("iesdouyin.com");
    }

    public static String extractAwemeId(String url) {
        if (StringUtils.isBlank(url)) {
            return null;
        }
        Matcher matcher = VIDEO_ID_PATTERN.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private static String trimUrl(String url) {
        return url.replaceAll("^[`'\"“”‘’<（(\\[【]+", "")
                .replaceAll("[`'\"“”‘’>，。；;、)）\\]】]+$", "");
    }
}
