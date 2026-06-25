package plugin

import (
	"os"
	"testing"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"

	"YaraFlow/internal/logger"
)

func TestMain(m *testing.M) {
	logger.Logger = zap.New(zapcore.NewCore(
		zapcore.NewJSONEncoder(zap.NewProductionEncoderConfig()),
		zapcore.AddSync(os.Stderr),
		zapcore.DebugLevel,
	))

	os.Exit(m.Run())
}
