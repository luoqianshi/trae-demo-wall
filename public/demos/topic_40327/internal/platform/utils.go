package platform

import (
	"bytes"
	"fmt"
	"image/png"
	"math/rand"
	"strings"
	"time"
	"unicode"

	"golang.org/x/image/webp"
)

func GenerateMessageID() string {
	return fmt.Sprintf("m%d", time.Now().UnixMilli())
}

func NowMilliseconds() int64 {
	return time.Now().UnixMilli()
}

func SplitSentences(text string) []string {
	text = strings.TrimSpace(text)
	if text == "" {
		return nil
	}

	runes := []rune(text)
	var sentences []string
	start := 0

	sentenceEnds := map[rune]bool{
		'。': true, '！': true, '？': true, '!': true, '?': true,
		'；': true, ';': true,
		'\n': true,
	}

	ellipsis := []rune{'…', '.', '.'}

	for i := 0; i < len(runes); i++ {
		r := runes[i]

		isEllipsis := false
		if i+2 < len(runes) && runes[i] == ellipsis[0] && runes[i+1] == ellipsis[1] && runes[i+2] == ellipsis[2] {
			isEllipsis = true
		}

		if isEllipsis || sentenceEnds[r] {
			end := i + 1
			if isEllipsis {
				end = i + 3
				i += 2
			}

			sentence := strings.TrimSpace(string(runes[start:end]))
			if sentence != "" && !isOnlyPunctuation(sentence) {
				sentences = append(sentences, sentence)
			}
			start = end
		}
	}

	if start < len(runes) {
		remaining := strings.TrimSpace(string(runes[start:]))
		if remaining != "" && !isOnlyPunctuation(remaining) {
			sentences = append(sentences, remaining)
		}
	}

	if len(sentences) <= 1 {
		return sentences
	}

	var merged []string
	current := sentences[0]
	for i := 1; i < len(sentences); i++ {
		next := sentences[i]
		currentRunes := []rune(current)
		nextRunes := []rune(next)

		if len(currentRunes) < 10 && len(nextRunes) < 8 {
			current = current + next
		} else {
			merged = append(merged, current)
			current = next
		}
	}
	merged = append(merged, current)

	if len(merged) == 0 {
		merged = sentences
	}

	return merged
}

func isOnlyPunctuation(s string) bool {
	for _, r := range s {
		if !unicode.IsPunct(r) && !unicode.IsSpace(r) && r != '…' {
			return false
		}
	}
	return true
}

func SplitDelay(minMs, maxMs int) time.Duration {
	rng := rand.New(rand.NewSource(time.Now().UnixNano()))
	delay := rng.Intn(maxMs-minMs+1) + minMs
	return time.Duration(delay) * time.Millisecond
}

func IsWebP(data []byte) bool {
	if len(data) < 12 {
		return false
	}
	return string(data[0:4]) == "RIFF" && string(data[8:12]) == "WEBP"
}

func ConvertWebPToPNG(data []byte) ([]byte, error) {
	img, err := webp.Decode(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("webp解码失败: %w", err)
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, fmt.Errorf("png编码失败: %w", err)
	}

	return buf.Bytes(), nil
}
