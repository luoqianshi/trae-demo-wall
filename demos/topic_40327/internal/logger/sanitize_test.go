package logger

import "testing"

func TestSanitizeValue_Empty(t *testing.T) {
	if SanitizeValue("") != "" {
		t.Error("空字符串应返回空")
	}
}

func TestSanitizeValue_Short(t *testing.T) {
	// 短字符串（<=6 字符）应统一返回 ****
	result := SanitizeValue("abc")
	if result != "****" {
		t.Errorf("短字符串应返回 ****, 实际 %q", result)
	}
}

func TestSanitizeValue_Long(t *testing.T) {
	// 长字符串应保留前4后2，中间用 *** 代替
	result := SanitizeValue("abcdefghij")
	// 期望 "abcd" + "***" + "ij"
	if result != "abcd***ij" {
		t.Errorf("长字符串脱敏结果应为 abcd***ij, 实际 %q", result)
	}
}

func TestSanitizeValue_Unicode(t *testing.T) {
	// Unicode 字符串
	result := SanitizeValue("你好世界测试token值")
	if result == "你好世界测试token值" {
		t.Error("Unicode 字符串应被脱敏")
	}
	if len(result) == 0 {
		t.Error("脱敏结果不应为空")
	}
}

func TestTruncateContent_Short(t *testing.T) {
	result := TruncateContent("短消息", 50)
	if result != "短消息" {
		t.Errorf("短内容不应被截断, 实际 %q", result)
	}
}

func TestTruncateContent_Long(t *testing.T) {
	longContent := "这是一段很长的消息内容需要被截断处理以避免日志中记录过多用户隐私信息"
	result := TruncateContent(longContent, 10)
	// 应包含截断标记
	if result == longContent {
		t.Error("长内容应被截断")
	}
}

func TestTruncateContent_DefaultMaxLen(t *testing.T) {
	// maxLen <= 0 时应使用默认值 50
	short := "短消息"
	result := TruncateContent(short, 0)
	if result != short {
		t.Errorf("短内容不应被截断, 实际 %q", result)
	}
}

func TestIsSensitiveKey(t *testing.T) {
	tests := []struct {
		key      string
		expected bool
	}{
		{"token", true},
		{"api_key", true},
		{"apikey", true},
		{"password", true},
		{"auth", true},
		{"secret", true},
		{"content", false},
		{"message", false},
		{"group_id", false},
		{"", false},
	}
	for _, tt := range tests {
		if got := IsSensitiveKey(tt.key); got != tt.expected {
			t.Errorf("IsSensitiveKey(%q) = %v, 期望 %v", tt.key, got, tt.expected)
		}
	}
}

func TestIsSensitiveKey_CaseInsensitive(t *testing.T) {
	if !IsSensitiveKey("TOKEN") {
		t.Error("TOKEN 应被识别为敏感字段（大小写不敏感）")
	}
	if !IsSensitiveKey("API_Key") {
		t.Error("API_Key 应被识别为敏感字段")
	}
}

func TestSanitizeField_String(t *testing.T) {
	result := SanitizeField("api_key", "sk-1234567890abcdef")
	if result == "sk-1234567890abcdef" {
		t.Error("敏感字符串字段应被脱敏")
	}
}

func TestSanitizeField_NonSensitive(t *testing.T) {
	result := SanitizeField("content", "hello world")
	if result != "hello world" {
		t.Error("非敏感字段不应被脱敏")
	}
}

func TestSanitizeField_NonString(t *testing.T) {
	result := SanitizeField("token", 12345)
	if result != "****" {
		t.Errorf("非字符串敏感字段应返回 ****, 实际 %v", result)
	}
}
