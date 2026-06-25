package platform

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

// atQQNumberRegex 匹配 @纯数字 的模式（如 @2583705834），用于清理消息中的 QQ号残留
var atQQNumberRegex = regexp.MustCompile(`\s*@\d{5,12}\s*`)

type MessageComponent interface {
	GetType() string
	Process() string
}

type TextComponent struct {
	Text string
}

func (c *TextComponent) GetType() string { return "text" }
func (c *TextComponent) Process() string { return c.Text }

type ImageComponent struct {
	URL       string
	Width     int
	Height    int
	Size      int
	IsSticker bool
}

func (c *ImageComponent) GetType() string { return "image" }
func (c *ImageComponent) Process() string { return "[图片]" }

type EmojiComponent struct {
	ID   string
	Name string
}

func (c *EmojiComponent) GetType() string { return "emoji" }
func (c *EmojiComponent) Process() string {
	if c.Name != "" {
		return fmt.Sprintf("[%s]", c.Name)
	}
	if name, ok := qqFaceNames[c.ID]; ok {
		return fmt.Sprintf("[%s]", name)
	}
	return fmt.Sprintf("[表情%s]", c.ID)
}

// QQ 内置表情 ID → 名称映射
// 来源：https://bot.q.qq.com/wiki/develop/api-v2/openapi/emoji/model.html
var qqFaceNames = map[string]string{
	"0":   "惊讶",
	"1":   "撇嘴",
	"2":   "色",
	"3":   "发呆",
	"4":   "得意",
	"5":   "流泪",
	"6":   "害羞",
	"7":   "闭嘴",
	"8":   "睡",
	"9":   "大哭",
	"10":  "尴尬",
	"11":  "发怒",
	"12":  "调皮",
	"13":  "呲牙",
	"14":  "微笑",
	"15":  "难过",
	"16":  "酷",
	"18":  "抓狂",
	"19":  "吐",
	"20":  "偷笑",
	"21":  "可爱",
	"22":  "白眼",
	"23":  "傲慢",
	"24":  "饥饿",
	"25":  "困",
	"26":  "惊恐",
	"27":  "流汗",
	"28":  "憨笑",
	"29":  "悠闲",
	"30":  "奋斗",
	"31":  "咒骂",
	"32":  "疑问",
	"33":  "嘘",
	"34":  "晕",
	"35":  "折磨",
	"36":  "衰",
	"37":  "骷髅",
	"38":  "敲打",
	"39":  "再见",
	"41":  "发抖",
	"42":  "爱情",
	"43":  "跳跳",
	"49":  "拥抱",
	"53":  "蛋糕",
	"54":  "闪电",
	"55":  "炸弹",
	"56":  "刀",
	"57":  "足球",
	"59":  "便便",
	"60":  "咖啡",
	"61":  "饭",
	"63":  "玫瑰",
	"64":  "凋谢",
	"66":  "爱心",
	"67":  "心碎",
	"69":  "礼物",
	"74":  "月亮",
	"75":  "太阳",
	"76":  "赞",
	"77":  "踩",
	"78":  "握手",
	"79":  "胜利",
	"84":  "飞吻",
	"85":  "怄火",
	"86":  "西瓜",
	"89":  "发抖",
	"96":  "坏笑",
	"97":  "左哼哼",
	"98":  "右哼哼",
	"99":  "哈欠",
	"100": "鄙视",
	"101": "委屈",
	"102": "快哭了",
	"103": "阴险",
	"104": "亲亲",
	"105": "吓",
	"106": "可怜",
	"107": "菜刀",
	"108": "西瓜",
	"109": "啤酒",
	"110": "篮球",
	"111": "乒乓球",
	"112": "示爱",
	"113": "瓢虫",
	"114": "抱拳",
	"115": "勾引",
	"116": "拳头",
	"117": "差劲",
	"118": "爱你",
	"119": "NO",
	"120": "OK",
	"121": "转圈",
	"122": "磕头",
	"123": "回头",
	"124": "跳绳",
	"125": "挥手",
	"126": "激动",
	"127": "街舞",
	"128": "献吻",
	"129": "左太极",
	"130": "右太极",
	"168": "迎财",
	"169": "灵机一动",
	"170": "头大",
	"171": "偷笑",
	"172": "脸红",
	"174": "扯一扯",
	"175": "吃瓜",
	"176": "打脸",
	"177": "卖萌",
	"178": "默默",
	"179": "耶",
	"180": "只想和你",
	"181": "感动",
	"182": "数钱",
	"183": "炸毛",
	"184": "再见",
	"185": "坏笑",
	"186": "挑眉",
	"187": "静静看着",
	"188": "裂开",
	"189": "抱头",
	"190": "搞怪",
	"191": "摸鱼",
	"192": "叹气",
	"193": "调整心情",
	"194": "认真工作",
	"199": "举牌牌",
	"200": "庆祝",
	"201": "老铁666",
	"202": "我没事",
	"204": "呼叫",
	"205": "甩头",
	"206": "接住",
	"207": "自闭",
	"208": "秃头",
	"209": "压力",
	"210": "害怕",
	"211": "打工人",
	"212": "尾款人",
	"213": "裂开",
	"214": "叹气",
	"215": "哇",
	"283": "黄脸狗头",
	"286": "黄脸白眼",
	"293": "摸锦鲤",
	"294": "求求",
	"312": "推眼镜",
	"314": "微笑狗头",
	"315": "庆祝",
	"316": "惊喜",
	"317": "财",
	"318": "动",
	"319": "福",
	"320": "发",
	"321": "拉面",
	"322": "绿帽子",
	"323": "没事",
	"324": "右亲亲",
	"325": "嗯嗯",
	"326": "看戏",
	"327": "好快乐",
	"328": "拜年",
	"329": "可以吗",
	"330": "学习",
	"331": "太棒了",
	"332": "拜托",
	"333": "给力",
	"334": "多喝热水",
	"335": "爆火",
	"336": "强壮",
	"337": "圆",
	"338": "天选",
	"339": "大展宏图",
	"340": "恭喜发财",
	"341": "开工大吉",
	"342": "龙年快乐",
	"343": "周五了",
}

type StickerComponent struct {
	URL string
}

func (c *StickerComponent) GetType() string { return "sticker" }
func (c *StickerComponent) Process() string { return "[表情包]" }

type AtComponent struct {
	QQ   string
	Name string
}

func (c *AtComponent) GetType() string { return "at" }
func (c *AtComponent) Process() string {
	if c.Name != "" {
		return fmt.Sprintf("@%s", c.Name)
	}
	return fmt.Sprintf("@%s", c.QQ)
}

type VoiceComponent struct {
	URL string
}

func (c *VoiceComponent) GetType() string { return "voice" }
func (c *VoiceComponent) Process() string { return "[语音]" }

type ForwardComponent struct {
	Content []interface{} // 转发消息中的嵌套消息段
}

func (c *ForwardComponent) GetType() string { return "forward" }
func (c *ForwardComponent) Process() string { return "[转发消息]" }

type ReplyComponent struct {
	MessageID string
	SenderID  string
}

func (c *ReplyComponent) GetType() string { return "reply" }
func (c *ReplyComponent) Process() string { return "" }

func parseComponent(seg map[string]interface{}) MessageComponent {
	segType, _ := seg["type"].(string)

	switch segType {
	case "text":
		text, _ := seg["text"].(string)
		return &TextComponent{Text: text}

	case "image_url":
		image := &ImageComponent{}
		if imageUrl, ok := seg["image_url"].(map[string]interface{}); ok {
			if url, ok := imageUrl["url"].(string); ok {
				image.URL = url
			}
			if width, ok := imageUrl["width"].(float64); ok {
				image.Width = int(width)
			}
			if height, ok := imageUrl["height"].(float64); ok {
				image.Height = int(height)
			}
			if subType, ok := imageUrl["sub_type"].(float64); ok && int(subType) == 1 {
				image.IsSticker = true
			}
		}
		if image.URL == "" {
			if url, ok := seg["url"].(string); ok {
				image.URL = url
			}
		}
		if subType, ok := seg["sub_type"].(float64); ok && int(subType) == 1 {
			image.IsSticker = true
		}
		return image

	case "image":
		image := &ImageComponent{}
		if url, ok := seg["url"].(string); ok {
			image.URL = url
		}
		if imageUrl, ok := seg["image_url"].(map[string]interface{}); ok {
			if url, ok := imageUrl["url"].(string); ok && image.URL == "" {
				image.URL = url
			}
		}
		if subType, ok := seg["sub_type"].(float64); ok && int(subType) == 1 {
			image.IsSticker = true
		}
		return image

	case "sticker", "emoji_image":
		sticker := &StickerComponent{}
		if stickerData, ok := seg["sticker"].(map[string]interface{}); ok {
			if url, ok := stickerData["url"].(string); ok {
				sticker.URL = url
			}
		}
		if sticker.URL == "" {
			if stickerData, ok := seg["emoji_image"].(map[string]interface{}); ok {
				if url, ok := stickerData["url"].(string); ok {
					sticker.URL = url
				}
			}
		}
		if sticker.URL == "" {
			if url, ok := seg["url"].(string); ok {
				sticker.URL = url
			}
		}
		if sticker.URL == "" {
			if imageUrl, ok := seg["image_url"].(map[string]interface{}); ok {
				if url, ok := imageUrl["url"].(string); ok {
					sticker.URL = url
				}
			}
		}
		return sticker

	case "face", "emoji":
		emoji := &EmojiComponent{}
		if id, ok := seg["id"].(string); ok {
			emoji.ID = id
		}
		if name, ok := seg["name"].(string); ok {
			emoji.Name = name
		}
		return emoji

	case "at":
		at := &AtComponent{}
		if qq, ok := seg["qq"].(string); ok {
			at.QQ = qq
		}
		if name, ok := seg["name"].(string); ok {
			at.Name = name
		}
		return at

	case "record", "voice":
		voice := &VoiceComponent{}
		// 尝试提取音频URL
		if file, ok := seg["file"].(string); ok {
			voice.URL = file
		} else if url, ok := seg["url"].(string); ok {
			voice.URL = url
		} else if data, ok := seg["data"].(map[string]interface{}); ok {
			if url, ok := data["url"].(string); ok {
				voice.URL = url
			} else if file, ok := data["file"].(string); ok {
				voice.URL = file
			}
		}
		return voice

	case "forward":
		forward := &ForwardComponent{}
		// 尝试从 data.content 中提取嵌套消息段
		if data, ok := seg["data"].(map[string]interface{}); ok {
			if content, ok := data["content"].([]interface{}); ok {
				forward.Content = content
			}
		}
		// 兼容：content 直接在 seg 层级
		if len(forward.Content) == 0 {
			if content, ok := seg["content"].([]interface{}); ok {
				forward.Content = content
			}
		}
		return forward

	case "reply":
		reply := &ReplyComponent{}
		if msgID, ok := seg["message_id"].(string); ok {
			reply.MessageID = msgID
		}
		if senderID, ok := seg["sender_id"]; ok {
			switch v := senderID.(type) {
			case string:
				reply.SenderID = v
			case float64:
				reply.SenderID = fmt.Sprintf("%.0f", v)
			}
		}
		return reply

	default:
		return &TextComponent{Text: fmt.Sprintf("[%s]", segType)}
	}
}

func ProcessMessageSegments(segments []interface{}) (*Message, error) {
	msg := &Message{
		Images:     []ImageInfo{},
		AtUsers:    []string{},
		HasImage:   false,
		HasSticker: false,
		HasEmoji:   false,
		IsAtMe:     false,
		IsAtAll:    false,
		HasVoice:   false,
	}

	botQQ := getBotQQ()
	var contentBuilder strings.Builder

	for _, segment := range segments {
		seg, ok := segment.(map[string]interface{})
		if !ok {
			continue
		}

		component := parseComponent(seg)
		contentBuilder.WriteString(component.Process())

		switch c := component.(type) {
		case *TextComponent:

		case *ImageComponent:
			msg.HasImage = true
			if c.IsSticker {
				msg.HasSticker = true
			}
			imgType := ImageTypeNormal
			if c.IsSticker {
				imgType = ImageTypeSticker
			}
			msg.Images = append(msg.Images, ImageInfo{
				URL:       c.URL,
				Type:      imgType,
				Width:     c.Width,
				Height:    c.Height,
				IsSticker: c.IsSticker,
			})

		case *StickerComponent:
			msg.HasImage = true
			msg.HasSticker = true
			msg.Images = append(msg.Images, ImageInfo{
				URL:  c.URL,
				Type: ImageTypeEmoji,
			})

		case *EmojiComponent:
			msg.HasEmoji = true

		case *AtComponent:
			msg.AtUsers = append(msg.AtUsers, c.QQ)
			if c.QQ == botQQ {
				msg.IsAtMe = true
			}
			if c.QQ == "all" {
				msg.IsAtAll = true
			}

		case *VoiceComponent:
			msg.HasVoice = true
			if c.URL != "" {
				msg.VoiceURL = c.URL
			}

		case *ForwardComponent:
			msg.IsForward = true
			// 递归统计转发消息中的图片数量
			msg.ForwardImageCount += countImagesRecursive(c.Content)

		case *ReplyComponent:
			msg.ReplyMessageID = c.MessageID
			msg.ReplySenderID = c.SenderID
		}
	}

	msg.Content = contentBuilder.String()
	msg.RawContent = msg.Content

	if msg.IsAtMe {
		msg.Content = removeAtBotTag(msg.Content)
	}

	// 清理所有 @纯数字 的残留（如 @2583705834），QQ号对 LLM 理解无意义
	msg.Content = removeAllAtQQNumbers(msg.Content)

	msg.Content = strings.TrimSpace(msg.Content)

	return msg, nil
}

// countImagesRecursive 递归统计嵌套消息段中的图片数量
// 用于转发消息等包含嵌套内容的消息类型
func countImagesRecursive(segments []interface{}) int {
	count := 0
	for _, seg := range segments {
		segMap, ok := seg.(map[string]interface{})
		if !ok {
			continue
		}
		segType, _ := segMap["type"].(string)
		switch segType {
		case "image", "image_url":
			count++
		case "forward":
			// 递归处理嵌套的转发消息
			if data, ok := segMap["data"].(map[string]interface{}); ok {
				if content, ok := data["content"].([]interface{}); ok {
					count += countImagesRecursive(content)
				}
			}
			if content, ok := segMap["content"].([]interface{}); ok {
				count += countImagesRecursive(content)
			}
		}
	}
	return count
}

func getBotQQ() string {
	if cfg.BotQQ != "" {
		return cfg.BotQQ
	}
	return "0"
}

func ExtractSegments(content interface{}) []interface{} {
	switch v := content.(type) {
	case string:
		return []interface{}{
			map[string]interface{}{
				"type": "text",
				"text": v,
			},
		}
	case []interface{}:
		return v
	default:
		return []interface{}{}
	}
}

func removeAtBotTag(content string) string {
	botQQ := getBotQQ()
	patterns := []string{
		fmt.Sprintf("@%s", botQQ),
		fmt.Sprintf("@%s ", botQQ),
		fmt.Sprintf(" @%s", botQQ),
		fmt.Sprintf(" @%s ", botQQ),
	}

	result := content
	for _, pattern := range patterns {
		result = strings.ReplaceAll(result, pattern, "")
	}

	return result
}

// removeAllAtQQNumbers 移除所有 @纯数字 的残留（如 @2583705834）
// QQ号对 LLM 理解消息内容没有意义，且会造成回复中误带 QQ号
func removeAllAtQQNumbers(content string) string {
	return atQQNumberRegex.ReplaceAllString(content, "")
}

func ExtractRawContent(content interface{}) string {
	switch v := content.(type) {
	case string:
		return v
	case []interface{}:
		var result strings.Builder
		for _, seg := range v {
			if segMap, ok := seg.(map[string]interface{}); ok {
				if segType, _ := segMap["type"].(string); segType == "text" {
					if text, ok := segMap["text"].(string); ok {
						result.WriteString(text)
					}
				}
			}
		}
		return result.String()
	default:
		data, err := json.Marshal(content)
		if err != nil {
			return fmt.Sprintf("%v", content)
		}
		return string(data)
	}
}
