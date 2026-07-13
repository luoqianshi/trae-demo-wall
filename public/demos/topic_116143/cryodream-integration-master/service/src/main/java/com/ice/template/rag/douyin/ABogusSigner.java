package com.ice.template.rag.douyin;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Random;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ABogusSigner {

    static {
        java.security.Security.addProvider(new BouncyCastleProvider());
    }

    private static final String S3 = "ckdp1h4ZKsUB80/Mfvw36XIgR25+WQAlEi7NLboqYTOPuzmFjJnryx9HVGDaStCe";

    private static final String S4 = "Dkdpgh2ZmsQB80/MfvV36XI1R45-WUAlEixNLwoqYTOPuzKFjJnry79HbGcaStCe";

    private static final String UA_KEY = "\u0000\u0001\u000e";

    private static final String END_STRING = "cus";

    private static final String DEFAULT_BROWSER = "1536|742|1536|864|0|0|0|0|1536|864|1536|864|1536|742|24|24|Win32";

    private static final String DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

    private static final int[] REG = {
            0x7384F68F, 0x491C3A09, 0x1724B159, 0xDAD1B6E0,
            0xA9716E5C, 0x163182C6, 0xE37A648D, 0xB0FB8286
    };

    private final int[] uaCode = generateUACode(DEFAULT_USER_AGENT);

    private final int[] browserCode = charCodeAt(DEFAULT_BROWSER);

    private final Random random = new Random();

    public String generateABogus(String urlParams, String method) {
        try {
            String string1 = generateString1();
            String string2 = generateString2(urlParams, method);
            return generateResult(string1 + string2, "s4");
        } catch (Exception e) {
            log.warn("生成抖音 a_bogus 签名失败: {}", e.getMessage());
            throw new IllegalStateException("生成抖音 a_bogus 签名失败", e);
        }
    }

    private String generateString1() {
        return fromCharCode(randomList()) + fromCharCode(randomListSimple()) + fromCharCode(randomListTail());
    }

    private String generateString2(String urlParams, String method) {
        long startTime = System.currentTimeMillis();
        long endTime = startTime + random.nextInt(5) + 4;
        int[] paramsArray = sm3ToArray(sm3ToArray(urlParams + END_STRING));
        int[] methodArray = sm3ToArray(sm3ToArray(method + END_STRING));
        int[] array = list4(
                (int) ((endTime >> 24) & 255),
                paramsArray[21],
                uaCode[23],
                (int) ((endTime >> 16) & 255),
                paramsArray[22],
                uaCode[24],
                (int) ((endTime >> 8) & 255),
                (int) (endTime & 255),
                (int) ((startTime >> 24) & 255),
                (int) ((startTime >> 16) & 255),
                (int) ((startTime >> 8) & 255),
                (int) (startTime & 255),
                methodArray[21],
                methodArray[22],
                (int) (endTime / 256 / 256 / 256 / 256),
                (int) (startTime / 256 / 256 / 256 / 256),
                browserCode.length,
                0
        );
        int checkNum = endCheckNum(array);
        int[] fullArray = new int[array.length + browserCode.length + 1];
        System.arraycopy(array, 0, fullArray, 0, array.length);
        System.arraycopy(browserCode, 0, fullArray, array.length, browserCode.length);
        fullArray[fullArray.length - 1] = checkNum;
        return rc4Encrypt(fromCharCode(fullArray), "y");
    }

    private int[] randomList() {
        return randomList(170, 85, 1, 2, 5, 45);
    }

    private int[] randomListSimple() {
        return randomList(170, 85, 1, 0, 0, 0);
    }

    private int[] randomListTail() {
        return randomList(170, 85, 1, 0, 5, 0);
    }

    private int[] randomList(int b, int c, int d, int e, int f, int g) {
        int r = (int) (Math.random() * 10000);
        int[] v = new int[7];
        v[0] = r;
        v[1] = r & 255;
        v[2] = r >> 8;
        v[3] = v[1] & b | d;
        v[4] = v[1] & c | e;
        v[5] = v[2] & b | f;
        v[6] = v[2] & c | g;
        int[] result = new int[4];
        System.arraycopy(v, 3, result, 0, 4);
        return result;
    }

    private static String fromCharCode(int[] codes) {
        StringBuilder sb = new StringBuilder();
        for (int code : codes) {
            sb.append((char) code);
        }
        return sb.toString();
    }

    private static int endCheckNum(int[] array) {
        int result = 0;
        for (int value : array) {
            result ^= value;
        }
        return result;
    }

    private int[] generateUACode(String userAgent) {
        String encrypted = rc4Encrypt(userAgent, UA_KEY);
        return sm3ToArray(charCodeAt(generateResult(encrypted, "s3")));
    }

    private int[] sm3ToArray(String data) {
        return digest(data.getBytes(StandardCharsets.UTF_8));
    }

    private int[] sm3ToArray(int[] data) {
        byte[] bytes = new byte[data.length];
        for (int i = 0; i < data.length; i++) {
            bytes[i] = (byte) data[i];
        }
        return digest(bytes);
    }

    private int[] digest(byte[] bytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("SM3", "BC");
            byte[] hash = md.digest(bytes);
            int[] result = new int[hash.length];
            for (int i = 0; i < hash.length; i++) {
                result[i] = hash[i] & 0xFF;
            }
            return result;
        } catch (Exception e) {
            throw new IllegalStateException("SM3 哈希失败", e);
        }
    }

    private static int[] list4(int a, int b, int c, int d, int e, int f, int g, int h,
                               int i, int j, int k, int m, int n, int o, int p, int q, int r, int s) {
        return new int[] {
                44, a, 0, 0, 0, 0, 24, b, n, 0, c, d, 0, 0, 0, 1,
                0, 239, e, o, f, g, 0, 0, 0, 0, h, 0, 0, 14, i, j,
                0, k, m, 3, p, 1, q, 1, r, 0, 0, 0, s
        };
    }

    private static String rc4Encrypt(String plaintext, String key) {
        int[] s = new int[256];
        for (int i = 0; i < 256; i++) {
            s[i] = i;
        }
        int j = 0;
        for (int i = 0; i < 256; i++) {
            j = (j + s[i] + key.charAt(i % key.length())) % 256;
            int temp = s[i];
            s[i] = s[j];
            s[j] = temp;
        }
        StringBuilder cipher = new StringBuilder();
        int i = 0;
        int k = 0;
        for (int idx = 0; idx < plaintext.length(); idx++) {
            i = (i + 1) % 256;
            k = (k + s[i]) % 256;
            int temp = s[i];
            s[i] = s[k];
            s[k] = temp;
            int t = (s[i] + s[k]) % 256;
            cipher.append((char) (s[t] ^ plaintext.charAt(idx)));
        }
        return cipher.toString();
    }

    private String generateResult(String s, String key) {
        StringBuilder r = new StringBuilder();
        String strMap = "s3".equals(key) ? S3 : S4;
        for (int i = 0; i < s.length(); i += 3) {
            int n;
            if (i + 2 < s.length()) {
                n = (s.charAt(i) << 16) | (s.charAt(i + 1) << 8) | s.charAt(i + 2);
            } else if (i + 1 < s.length()) {
                n = (s.charAt(i) << 16) | (s.charAt(i + 1) << 8);
            } else {
                n = s.charAt(i) << 16;
            }
            int[] shifts = {18, 12, 6, 0};
            int[] masks = {0xFC0000, 0x03F000, 0x0FC0, 0x3F};
            for (int j = 0; j < 4; j++) {
                if (shifts[j] == 6 && i + 1 >= s.length()) {
                    break;
                }
                if (shifts[j] == 0 && i + 2 >= s.length()) {
                    break;
                }
                r.append(strMap.charAt((n & masks[j]) >> shifts[j]));
            }
        }
        int padding = (4 - r.length() % 4) % 4;
        for (int i = 0; i < padding; i++) {
            r.append("=");
        }
        return r.toString();
    }

    private static int[] charCodeAt(String str) {
        int[] result = new int[str.length()];
        for (int i = 0; i < str.length(); i++) {
            result[i] = str.charAt(i);
        }
        return result;
    }
}
