package logger

import (
	"strings"

	"go.uber.org/zap"
	"go.uber.org/zap/buffer"
	"go.uber.org/zap/zapcore"
)

const (
	ansiReset     = "\033[0m"
	ansiBold      = "\033[1m"
	ansiDim       = "\033[2m"
	ansiItalic    = "\033[3m"
	ansiFgRed     = "\033[31m"
	ansiFgGreen   = "\033[32m"
	ansiFgYellow  = "\033[33m"
	ansiFgBlue    = "\033[34m"
	ansiFgMagenta = "\033[35m"
	ansiFgCyan    = "\033[36m"
	ansiFgWhite   = "\033[37m"

	ansi256Orange   = "\033[38;5;208m"
	ansi256SkyBlue  = "\033[38;5;117m"
	ansi256Gold     = "\033[38;5;220m"
	ansi256Lime     = "\033[38;5;118m"
	ansi256Teal     = "\033[38;5;37m"
	ansi256Coral    = "\033[38;5;204m"
	ansi256Lavender = "\033[38;5;183m"
	ansi256Salmon   = "\033[38;5;210m"
	ansi256Mint     = "\033[38;5;121m"
	ansi256Peach    = "\033[38;5;215m"
	ansi256Slate    = "\033[38;5;111m"
)

// 每个功能模块拥有独立颜色，终端日志一眼区分来源
var moduleColors = map[string]string{
	"预处理":   ansi256SkyBlue,
	"规划器":   ansiFgGreen,
	"回复器":   ansi256Orange,
	"工具":    ansiFgMagenta,
	"记忆":    ansi256Teal,
	"备忘录":   ansi256Lime,
	"图谱":    ansi256Mint,
	"画像":    ansi256Peach,
	"黑话":    ansi256Gold,
	"插件":    ansi256Coral,
	"规则引擎":  ansi256Lavender,
	"群处理":   ansi256Slate,
	"消息发送":  ansiFgBlue,
	"表情包":   ansi256Salmon,
	"WebUI": ansiFgCyan,
	"LLM":   ansiFgYellow,
	"事件总线":  ansiDim + ansiFgWhite,
	"配置":    ansiFgWhite,
	"主程序":   ansiBold + ansiFgWhite,
}

var moduleAliases = map[string]string{
	"[预处理]":                  "预处理",
	"[决策]":                   "规划器",
	"[多轮推理]":                 "规划器",
	"[规划器]":                  "规划器",
	"[回复]":                   "回复器",
	"[ReplyGenerator]":       "回复器",
	"[内置工具]":                 "工具",
	"[记忆]":                   "记忆",
	"[备忘录]":                  "备忘录",
	"[图谱]":                   "图谱",
	"[画像同步]":                 "画像",
	"[PersonProfileSyncer]":  "画像",
	"[PersonFactWriter]":     "画像",
	"[黑话]":                   "黑话",
	"[Plugin]":               "插件",
	"[规则引擎]":                 "规则引擎",
	"[GroupProcessor]":       "群处理",
	"[消息发送]":                 "消息发送",
	"[表情包]":                  "表情包",
	"[WebUI]":                "WebUI",
	"[LLM]":                  "LLM",
	"[事件总线]":                 "事件总线",
	"[配置]":                   "配置",
	"[PeriodicMemoryWriter]": "记忆",
}

var levelStyles = map[zapcore.Level]struct {
	icon  string
	color string
}{
	zapcore.DebugLevel: {icon: "·", color: ansiDim + ansiFgWhite},
	zapcore.InfoLevel:  {icon: "›", color: ansi256SkyBlue},
	zapcore.WarnLevel:  {icon: "!", color: ansiFgYellow},
	zapcore.ErrorLevel: {icon: "✗", color: ansiFgRed},
	zapcore.FatalLevel: {icon: "☠", color: ansiBold + ansiFgRed},
}

// coloredEncoder 自定义控制台编码器
type coloredEncoder struct {
	zapcore.Encoder
	buf *strings.Builder
}

func newColoredEncoder() zapcore.Encoder {
	encCfg := zap.NewDevelopmentEncoderConfig()
	encCfg.TimeKey = ""
	encCfg.LevelKey = ""
	encCfg.NameKey = ""
	encCfg.CallerKey = ""
	encCfg.MessageKey = ""
	encCfg.StacktraceKey = ""
	return &coloredEncoder{
		Encoder: zapcore.NewConsoleEncoder(encCfg),
		buf:     &strings.Builder{},
	}
}

func (e *coloredEncoder) Clone() zapcore.Encoder {
	return &coloredEncoder{
		Encoder: e.Encoder.Clone(),
		buf:     &strings.Builder{},
	}
}

func (e *coloredEncoder) EncodeEntry(ent zapcore.Entry, fields []zapcore.Field) (*buffer.Buffer, error) {
	b := e.buf
	b.Reset()

	// 时间戳：06-07 14:30:25
	ts := ent.Time.Format("01-02 15:04:05")
	b.WriteString(ansiDim)
	b.WriteString(ts)
	b.WriteString(ansiReset)

	style, ok := levelStyles[ent.Level]
	if !ok {
		style = levelStyles[zapcore.InfoLevel]
	}
	b.WriteString(" ")
	b.WriteString(style.color)
	b.WriteString(style.icon)
	b.WriteString(ansiReset)

	module, alias := resolveModule(ent.Message)
	b.WriteString(" ")
	if color, hasColor := moduleColors[alias]; hasColor {
		b.WriteString(color)
		b.WriteString(padRight(alias, 6))
		b.WriteString(ansiReset)
	} else if module != "" {
		b.WriteString(ansiFgCyan)
		b.WriteString(padRight(module, 6))
		b.WriteString(ansiReset)
	}

	// 消息内容（去掉已识别的模块前缀）
	msg := ent.Message
	if module != "" {
		msg = strings.TrimSpace(strings.TrimPrefix(ent.Message, module))
	}

	switch ent.Level {
	case zapcore.WarnLevel:
		b.WriteString(ansiFgYellow)
		b.WriteString(msg)
		b.WriteString(ansiReset)
	case zapcore.ErrorLevel, zapcore.FatalLevel:
		b.WriteString(ansiFgRed)
		b.WriteString(msg)
		b.WriteString(ansiReset)
	default:
		b.WriteString(msg)
	}

	if len(fields) > 0 {
		innerBuf, err := e.Encoder.EncodeEntry(zapcore.Entry{Message: ""}, fields)
		if err == nil && innerBuf.Len() > 0 {
			fieldStr := strings.TrimSpace(innerBuf.String())
			if fieldStr != "" {
				b.WriteString(" ")
				b.WriteString(ansiDim)
				b.WriteString(fieldStr)
				b.WriteString(ansiReset)
			}
			innerBuf.Free()
		}
	}

	b.WriteString("\n")

	ret := bufPool.Get()
	ret.WriteString(b.String())
	return ret, nil
}

var bufPool = buffer.NewPool()

// resolveModule 从消息中提取模块标签和别名
func resolveModule(msg string) (tag string, alias string) {
	if !strings.HasPrefix(msg, "[") {
		return "", ""
	}
	end := strings.Index(msg, "]")
	if end < 0 {
		return "", ""
	}
	tag = msg[:end+1]
	if a, ok := moduleAliases[tag]; ok {
		return tag, a
	}
	// 未知模块，取括号内文字作为别名
	inner := tag[1 : len(tag)-1]
	return tag, inner
}

// padRight 右侧填充空格到指定显示宽度（兼容 CJK 双宽字符）
func padRight(s string, width int) string {
	displayLen := 0
	for _, r := range s {
		if r > 0x2E80 {
			displayLen += 2
		} else {
			displayLen++
		}
	}
	if displayLen >= width {
		return s
	}
	return s + strings.Repeat(" ", width-displayLen)
}
