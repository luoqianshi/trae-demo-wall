package logger

import "unicode/utf8"

// 脱敏相关工具函数，用于在日志中记录敏感信息时进行遮蔽处理

// sensitiveKeyChars 敏感字段名包含这些子串时触发脱敏
var sensitiveKeyPatterns = []string{
	"token", "password", "passwd", "secret", "api_key", "apikey",
	"api-key", "auth", "credential", "private_key", "access_key",
}

// SanitizeValue 对敏感值进行脱敏，只保留前 4 位和后 2 位，中间用 * 代替
// 空字符串或过短值（<=6 字符）统一返回 "****"
func SanitizeValue(val string) string {
	if val == "" {
		return ""
	}
	runeVal := []rune(val)
	n := len(runeVal)
	if n <= 6 {
		return "****"
	}
	// 保留前 4 位和后 2 位
	masked := make([]rune, 0, n)
	masked = append(masked, runeVal[:4]...)
	masked = append(masked, []rune("***")...)
	masked = append(masked, runeVal[n-2:]...)
	return string(masked)
}

// TruncateContent 截断长文本内容，超过 maxLen 字符时截断并添加省略标记
// 用于日志中记录用户消息/回复内容时避免完整记录
func TruncateContent(content string, maxLen int) string {
	if maxLen <= 0 {
		maxLen = 50
	}
	n := utf8.RuneCountInString(content)
	if n <= maxLen {
		return content
	}
	runes := []rune(content)
	return string(runes[:maxLen]) + "...(truncated)"
}

// IsSensitiveKey 判断字段名是否为敏感字段（需要脱敏）
func IsSensitiveKey(key string) bool {
	if key == "" {
		return false
	}
	lowerKey := toLowerASCII(key)
	for _, pattern := range sensitiveKeyPatterns {
		if contains(lowerKey, pattern) {
			return true
		}
	}
	return false
}

// SanitizeField 对可能敏感的字段值进行脱敏，返回脱敏后的值
// 若 key 被判定为敏感字段，则对 value 调用 SanitizeValue
func SanitizeField(key string, value interface{}) interface{} {
	if !IsSensitiveKey(key) {
		return value
	}
	switch v := value.(type) {
	case string:
		return SanitizeValue(v)
	default:
		return "****"
	}
}

func toLowerASCII(s string) string {
	b := []byte(s)
	for i, c := range b {
		if c >= 'A' && c <= 'Z' {
			b[i] = c + 32
		}
	}
	return string(b)
}

func contains(s, substr string) bool {
	if len(substr) == 0 {
		return true
	}
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
