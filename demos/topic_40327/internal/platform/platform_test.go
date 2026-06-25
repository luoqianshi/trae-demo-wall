package platform

import (
	"testing"
	"time"
)

func TestSplitSentencesEmpty(t *testing.T) {
	result := SplitSentences("")
	if len(result) != 0 {
		t.Errorf("空文本应返回空切片, 实际 %v", result)
	}
}

func TestSplitSentencesWhitespace(t *testing.T) {
	result := SplitSentences("   ")
	if len(result) != 0 {
		t.Errorf("纯空白应返回空切片, 实际 %v", result)
	}
}

func TestSplitSentencesSingle(t *testing.T) {
	result := SplitSentences("你好")
	if len(result) != 1 {
		t.Fatalf("预期1句, 实际 %d: %v", len(result), result)
	}
	if result[0] != "你好" {
		t.Errorf("预期 '你好', 实际 '%s'", result[0])
	}
}

func TestSplitSentencesByPeriod(t *testing.T) {
	result := SplitSentences("今天天气真好啊阳光明媚。适合出去散步玩耍呢。")
	if len(result) != 2 {
		t.Fatalf("预期2句, 实际 %d: %v", len(result), result)
	}
}

func TestSplitSentencesByExclamation(t *testing.T) {
	result := SplitSentences("今天真是太棒了呀！真的吗我不相信！")
	if len(result) != 2 {
		t.Fatalf("预期2句, 实际 %d: %v", len(result), result)
	}
}

func TestSplitSentencesByQuestion(t *testing.T) {
	result := SplitSentences("你今天吃饭了没有呀？今天打算去哪里玩呢？")
	if len(result) != 2 {
		t.Fatalf("预期2句, 实际 %d: %v", len(result), result)
	}
}

func TestSplitSentencesBySemicolon(t *testing.T) {
	result := SplitSentences("这是第一个很重要的要点；这是第二个关键的点；这是第三个核心的点")
	if len(result) != 3 {
		t.Fatalf("预期3句, 实际 %d: %v", len(result), result)
	}
}

func TestSplitSentencesByNewline(t *testing.T) {
	result := SplitSentences("第一行的内容在这里哦\n第二行的内容在这里呀\n第三行的内容在这里啦")
	if len(result) != 3 {
		t.Fatalf("预期3句, 实际 %d: %v", len(result), result)
	}
}

func TestSplitSentencesMixed(t *testing.T) {
	result := SplitSentences("你好啊我的好朋友！最近过得还好吗怎么样？今天天气真的很不错呢。")
	if len(result) != 3 {
		t.Fatalf("预期3句, 实际 %d: %v", len(result), result)
	}
}

func TestSplitSentencesShortMerge(t *testing.T) {
	result := SplitSentences("嗯。好的呀。真的非常感谢你啦。不用这么客气啦。")
	if len(result) < 2 {
		t.Fatalf("短句应合并, 预期至少2句, 实际 %d: %v", len(result), result)
	}
}

func TestSplitSentencesPunctuationOnly(t *testing.T) {
	result := SplitSentences("！！！？？？")
	if len(result) != 0 {
		t.Errorf("纯标点应返回空切片, 实际 %v", result)
	}
}

func TestIsWebPValid(t *testing.T) {
	data := []byte("RIFF\x00\x00\x00\x00WEBP")
	if !IsWebP(data) {
		t.Error("应识别为 WebP 格式")
	}
}

func TestIsWebPTooShort(t *testing.T) {
	data := []byte("RIFF")
	if IsWebP(data) {
		t.Error("太短的数据不应识别为 WebP")
	}
}

func TestIsWebPInvalid(t *testing.T) {
	data := []byte("RIFF\x00\x00\x00\x00XXXX")
	if IsWebP(data) {
		t.Error("非 WebP 格式不应识别为 WebP")
	}
}

func TestIsWebPPNG(t *testing.T) {
	// PNG header: 89 50 4E 47
	data := []byte("\x89PNG\r\n\x1a\n")
	if IsWebP(data) {
		t.Error("PNG 不应识别为 WebP")
	}
}

func TestIsWebPJPEG(t *testing.T) {
	data := []byte("\xff\xd8\xff\xe0\x00\x10JFIF\x00")
	if IsWebP(data) {
		t.Error("JPEG 不应识别为 WebP")
	}
}

func TestSplitDelayRange(t *testing.T) {
	for i := 0; i < 100; i++ {
		d := SplitDelay(100, 200)
		if d < 100*time.Millisecond || d > 200*time.Millisecond {
			t.Errorf("延迟应在[100ms,200ms]内, 实际 %v", d)
		}
	}
}

func TestGenerateMessageIDNotEmpty(t *testing.T) {
	id := GenerateMessageID()
	if id == "" {
		t.Error("消息ID不应为空")
	}
}

func TestGenerateMessageIDPrefix(t *testing.T) {
	id := GenerateMessageID()
	if len(id) < 2 || id[0] != 'm' {
		t.Errorf("消息ID应以 'm' 开头, 实际 %s", id)
	}
}

func TestNowMillisecondsPositive(t *testing.T) {
	ts := NowMilliseconds()
	if ts <= 0 {
		t.Errorf("时间戳应为正数, 实际 %d", ts)
	}
}

func TestExtractSegmentsString(t *testing.T) {
	result := ExtractSegments("hello")
	if len(result) != 1 {
		t.Fatalf("预期1个segment, 实际 %d", len(result))
	}
	seg, ok := result[0].(map[string]interface{})
	if !ok {
		t.Fatal("segment 应为 map")
	}
	if seg["type"] != "text" || seg["text"] != "hello" {
		t.Errorf("unexpected segment: %v", seg)
	}
}

func TestExtractSegmentsSlice(t *testing.T) {
	input := []interface{}{
		map[string]interface{}{"type": "text", "text": "hi"},
	}
	result := ExtractSegments(input)
	if len(result) != 1 {
		t.Fatalf("预期1个segment, 实际 %d", len(result))
	}
}

func TestExtractSegmentsNil(t *testing.T) {
	result := ExtractSegments(nil)
	if len(result) != 0 {
		t.Errorf("nil 输入应返回空切片, 实际 %v", result)
	}
}

func TestExtractRawContentString(t *testing.T) {
	result := ExtractRawContent("hello world")
	if result != "hello world" {
		t.Errorf("预期 'hello world', 实际 '%s'", result)
	}
}

func TestExtractRawContentSegments(t *testing.T) {
	input := []interface{}{
		map[string]interface{}{"type": "text", "text": "hello"},
		map[string]interface{}{"type": "image", "url": "x"},
		map[string]interface{}{"type": "text", "text": "world"},
	}
	result := ExtractRawContent(input)
	if result != "helloworld" {
		t.Errorf("预期 'helloworld', 实际 '%s'", result)
	}
}

func TestExtractRawContentNoText(t *testing.T) {
	input := []interface{}{
		map[string]interface{}{"type": "image", "url": "x"},
	}
	result := ExtractRawContent(input)
	if result != "" {
		t.Errorf("预期空字符串, 实际 '%s'", result)
	}
}