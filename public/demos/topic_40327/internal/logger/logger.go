package logger

import (
	"crypto/rand"
	"encoding/hex"
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// Config 日志配置
type Config struct {
	ConsoleLevel string
	FileLevel    string
	FilePath     string
	MaxLogDays   int
}

var Logger *zap.Logger
var Sugar *zap.SugaredLogger
var rotateWriter *DailyRotateWriter
var consoleLevel zapcore.Level // 记录当前控制台日志级别，用于 LogHook 过滤

func init() {
	// 默认初始化一个 no-op logger，避免测试环境下 Sugar 为 nil 导致 panic
	Logger = zap.NewNop()
	Sugar = Logger.Sugar()
}

// LogHook 日志钩子回调，用于将日志推送到前端 SSE 流
var LogHook func(level, msg string)

func SetLogHook(hook func(level, msg string)) {
	LogHook = hook
}

func Init(cfg Config) error {
	maxDays := cfg.MaxLogDays
	if maxDays <= 0 {
		maxDays = 30
	}

	writer, err := NewDailyRotateWriter(cfg.FilePath, maxDays)
	if err != nil {
		return err
	}
	rotateWriter = writer

	consoleLevel = getZapLevel(cfg.ConsoleLevel)
	fileLevel := getZapLevel(cfg.FileLevel)

	consoleEncoder := newColoredEncoder()
	fileEncoder := zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig())

	consoleCore := zapcore.NewCore(
		consoleEncoder,
		zapcore.Lock(os.Stdout),
		consoleLevel,
	)

	fileCore := zapcore.NewCore(
		fileEncoder,
		zapcore.AddSync(writer),
		fileLevel,
	)

	core := zapcore.NewTee(consoleCore, fileCore)
	// 用 hookCore 包装，拦截所有日志写入（包括 Sugared 方法），确保前端 SSE 不漏收日志
	core = &hookCore{Core: core}
	Logger = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zap.ErrorLevel))
	Sugar = Logger.Sugar()

	return nil
}

func Close() {
	if rotateWriter != nil {
		rotateWriter.Close()
	}
}

func getZapLevel(levelStr string) zapcore.Level {
	switch levelStr {
	case "debug":
		return zapcore.DebugLevel
	case "info":
		return zapcore.InfoLevel
	case "warn":
		return zapcore.WarnLevel
	case "error":
		return zapcore.ErrorLevel
	default:
		return zapcore.InfoLevel
	}
}

// GenerateTraceID 生成一个16字符的十六进制 trace ID
func GenerateTraceID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// WithTrace 返回一个带有 trace_id 字段的 SugaredLogger
func WithTrace(traceID string) *zap.SugaredLogger {
	return Sugar.With(zap.String("trace_id", traceID))
}

// hookCore 拦截所有日志写入，确保 Sugared 日志也能推送到前端 SSE
// 原先仅在 logger.Info/Debug/Warn/Error 包装函数中调用 callHook，
// 但项目大量使用 logger.Sugar.Infow/Debugw 等 Sugared 方法，
// 这些方法绕过包装函数直接写入底层 core，导致前端收不到日志。
type hookCore struct {
	zapcore.Core
}

func (h *hookCore) Write(entry zapcore.Entry, fields []zapcore.Field) error {
	callHook(entry.Level.String(), entry.Message)
	return h.Core.Write(entry, fields)
}

func (h *hookCore) Check(entry zapcore.Entry, ce *zapcore.CheckedEntry) *zapcore.CheckedEntry {
	// Check 在 Write 之前被调用，且 result 非 nil 才表示日志级别通过
	// 必须在此处调用 LogHook，因为 Write 方法不会被框架回调到
	// （hookCore.Check 委托给内部 Core，CheckedEntry 记录的是内部 Core 而非 hookCore）
	// 注意：ce 是调用方传入的参数，始终为 nil；需要检查的是 h.Core.Check 的返回值
	result := h.Core.Check(entry, ce)
	if result != nil {
		callHook(entry.Level.String(), entry.Message)
	}
	return result
}

func Debug(msg string, fields ...zap.Field) {
	Logger.Debug(msg, fields...)
}

func Info(msg string, fields ...zap.Field) {
	Logger.Info(msg, fields...)
}

func Warn(msg string, fields ...zap.Field) {
	Logger.Warn(msg, fields...)
}

func Error(msg string, fields ...zap.Field) {
	Logger.Error(msg, fields...)
}

func callHook(level, msg string) {
	if LogHook == nil {
		return
	}
	// 只推送级别 >= 控制台级别的日志，避免前端收到比终端更多的日志
	hookLevel := getZapLevel(level)
	if hookLevel < consoleLevel {
		return
	}
	LogHook(level, msg)
}
