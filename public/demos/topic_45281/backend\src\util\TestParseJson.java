package util;

import java.util.Map;

public class TestParseJson {
    public static void main(String[] args) {
        String json = "{\"patientId\":41,\"doctorId\":2,\"dept\":\"外科\",\"regFee\":50,\"regStatus\":\"已挂号\",\"regTime\":\"2026-06-05T10:00:00\"}";
        System.out.println("Input JSON: " + json);
        
        Map<String, String> params = JsonUtil.parseJson(json);
        for (Map.Entry<String, String> entry : params.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            System.out.println("Key: '" + key + "', Value: '" + value + "', len: " + value.length());
            if (value != null) {
                System.out.println("  Bytes (UTF-8): " + value.getBytes(java.nio.charset.StandardCharsets.UTF_8).length);
                System.out.println("  Bytes (UTF-16): " + value.getBytes(java.nio.charset.StandardCharsets.UTF_16).length);
            }
        }
        
        String regStatus = params.get("regStatus");
        System.out.println("\nregStatus equals '已挂号': " + "已挂号".equals(regStatus));
        System.out.println("regStatus equals 'waiting': " + "waiting".equals(regStatus));
        
        if ("已挂号".equals(regStatus)) {
            regStatus = "waiting";
        }
        System.out.println("After conversion: " + regStatus);
    }
}