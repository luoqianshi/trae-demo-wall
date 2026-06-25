package util;

import bean.*;
import com.google.gson.Gson;
import java.util.*;

public class JsonUtil {
    private static final Gson gson = new Gson();

    public static String toJson(List<?> list) {
        return gson.toJson(list);
    }

    public static String toJson(Object obj) {
        return gson.toJson(obj);
    }

    public static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
    }

    public static Map<String, String> parseJson(String json) {
        Map<String, String> map = new HashMap<>();
        if (json == null || json.trim().isEmpty()) return map;

        json = json.trim();
        if (json.startsWith("{") && json.endsWith("}")) {
            json = json.substring(1, json.length() - 1);
        }

        int i = 0;
        while (i < json.length()) {
            if (json.charAt(i) == ' ' || json.charAt(i) == ',') {
                i++;
                continue;
            }

            int colonIndex = json.indexOf(':', i);
            if (colonIndex == -1) break;

            String key = json.substring(i, colonIndex).trim();
            if (key.startsWith("\"") && key.endsWith("\"")) {
                key = key.substring(1, key.length() - 1);
            }

            int valueStart = colonIndex + 1;
            while (valueStart < json.length() && (json.charAt(valueStart) == ' ' || json.charAt(valueStart) == ',')) {
                valueStart++;
            }

            if (valueStart >= json.length()) break;

            char firstChar = json.charAt(valueStart);
            String value;

            if (firstChar == '"') {
                int endQuote = json.indexOf('"', valueStart + 1);
                while (endQuote != -1 && json.charAt(endQuote - 1) == '\\') {
                    endQuote = json.indexOf('"', endQuote + 1);
                }
                if (endQuote == -1) break;
                value = json.substring(valueStart + 1, endQuote);
                i = endQuote + 1;
            } else if (firstChar == '[') {
                int bracketCount = 1;
                int end = valueStart + 1;
                while (end < json.length() && bracketCount > 0) {
                    if (json.charAt(end) == '[') bracketCount++;
                    else if (json.charAt(end) == ']') bracketCount--;
                    end++;
                }
                value = json.substring(valueStart, end);
                i = end;
            } else if (firstChar == '{') {
                int braceCount = 1;
                int end = valueStart + 1;
                while (end < json.length() && braceCount > 0) {
                    if (json.charAt(end) == '{') braceCount++;
                    else if (json.charAt(end) == '}') braceCount--;
                    end++;
                }
                value = json.substring(valueStart, end);
                i = end;
            } else if (firstChar == 'n' && json.substring(valueStart).startsWith("null")) {
                value = "";
                i = valueStart + 4;
            } else {
                int end = valueStart;
                while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') {
                    end++;
                }
                value = json.substring(valueStart, end).trim();
                if (value.equals("null")) value = "";
                i = end;
            }

            map.put(key, value);
        }
        return map;
    }

    public static Map<String, Object> parseJsonToMap(String json) {
        Map<String, Object> map = new HashMap<>();
        if (json == null || json.trim().isEmpty()) return map;

        json = json.trim();
        if (json.startsWith("{") && json.endsWith("}")) {
            json = json.substring(1, json.length() - 1);
        }

        int i = 0;
        while (i < json.length()) {
            if (json.charAt(i) == ' ' || json.charAt(i) == ',') {
                i++;
                continue;
            }

            int colonIndex = json.indexOf(':', i);
            if (colonIndex == -1) break;

            String key = json.substring(i, colonIndex).trim();
            if (key.startsWith("\"") && key.endsWith("\"")) {
                key = key.substring(1, key.length() - 1);
            }

            int valueStart = colonIndex + 1;
            while (valueStart < json.length() && (json.charAt(valueStart) == ' ' || json.charAt(valueStart) == ',')) {
                valueStart++;
            }

            if (valueStart >= json.length()) break;

            char firstChar = json.charAt(valueStart);
            Object value;

            if (firstChar == '"') {
                int endQuote = json.indexOf('"', valueStart + 1);
                while (endQuote != -1 && json.charAt(endQuote - 1) == '\\') {
                    endQuote = json.indexOf('"', endQuote + 1);
                }
                if (endQuote == -1) break;
                value = json.substring(valueStart + 1, endQuote);
                i = endQuote + 1;
            } else if (firstChar == '[') {
                int bracketCount = 1;
                int end = valueStart + 1;
                while (end < json.length() && bracketCount > 0) {
                    if (json.charAt(end) == '[') bracketCount++;
                    else if (json.charAt(end) == ']') bracketCount--;
                    end++;
                }
                String arrayJson = json.substring(valueStart, end);
                value = parseJsonArray(arrayJson);
                i = end;
            } else if (firstChar == '{') {
                int braceCount = 1;
                int end = valueStart + 1;
                while (end < json.length() && braceCount > 0) {
                    if (json.charAt(end) == '{') braceCount++;
                    else if (json.charAt(end) == '}') braceCount--;
                    end++;
                }
                String objJson = json.substring(valueStart, end);
                value = parseJsonToMap(objJson);
                i = end;
            } else if (firstChar == 'n' && json.substring(valueStart).startsWith("null")) {
                value = null;
                i = valueStart + 4;
            } else if (firstChar == 't' && json.substring(valueStart).startsWith("true")) {
                value = true;
                i = valueStart + 4;
            } else if (firstChar == 'f' && json.substring(valueStart).startsWith("false")) {
                value = false;
                i = valueStart + 5;
            } else {
                int end = valueStart;
                while (end < json.length() && json.charAt(end) != ',' && json.charAt(end) != '}') {
                    end++;
                }
                String numStr = json.substring(valueStart, end).trim();
                if (numStr.contains(".")) {
                    value = Double.parseDouble(numStr);
                } else {
                    value = Integer.parseInt(numStr);
                }
                i = end;
            }

            map.put(key, value);
        }
        return map;
    }

    public static List<Map<String, Object>> parseJsonArray(String json) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (json == null || json.trim().isEmpty()) return list;

        json = json.trim();
        if (json.startsWith("[") && json.endsWith("]")) {
            json = json.substring(1, json.length() - 1);
        }

        int i = 0;
        while (i < json.length()) {
            while (i < json.length() && (json.charAt(i) == ' ' || json.charAt(i) == ',')) {
                i++;
            }
            if (i >= json.length()) break;

            if (json.charAt(i) == '{') {
                int braceCount = 1;
                int end = i + 1;
                while (end < json.length() && braceCount > 0) {
                    if (json.charAt(end) == '{') braceCount++;
                    else if (json.charAt(end) == '}') braceCount--;
                    end++;
                }
                String objJson = json.substring(i, end);
                list.add(parseJsonToMap(objJson));
                i = end;
            } else {
                i++;
            }
        }
        return list;
    }

    }