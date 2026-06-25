package storage

import (
	"os"
	"testing"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"YaraFlow/internal/logger"
)

func TestMain(m *testing.M) {
	// 用 nop logger 初始化，避免测试中 logger 为 nil
	logger.Logger = zap.New(zapcore.NewCore(
		zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()),
		zapcore.AddSync(os.Stderr),
		zapcore.DebugLevel,
	))

	os.Exit(m.Run())
}
