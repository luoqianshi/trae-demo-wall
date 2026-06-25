module YaraFlow

go 1.25.0

require (
	YaraFlow/internal/browser v0.0.0-00010101000000-000000000000
	YaraFlow/internal/bus v0.0.0-00010101000000-000000000000
	YaraFlow/internal/dedupe v0.0.0-00010101000000-000000000000
	YaraFlow/internal/hook v0.0.0-00010101000000-000000000000
	YaraFlow/internal/knowledge v0.0.0-00010101000000-000000000000
	YaraFlow/internal/logger v0.0.0-00010101000000-000000000000
	YaraFlow/internal/metrics v0.0.0-00010101000000-000000000000
	YaraFlow/internal/monitor v0.0.0-00010101000000-000000000000
	YaraFlow/internal/personality v0.0.0-00010101000000-000000000000
	YaraFlow/internal/platform v0.0.0-00010101000000-000000000000
	YaraFlow/internal/pool v0.0.0-00010101000000-000000000000
	YaraFlow/internal/search v0.0.0-00010101000000-000000000000
	YaraFlow/internal/tracing v0.0.0-00010101000000-000000000000
	github.com/dop251/goja v0.0.0-20260311135729-065cd970411c
	github.com/fsnotify/fsnotify v1.7.0
	github.com/mattn/go-sqlite3 v1.14.44
	github.com/spf13/viper v1.18.2
	go.uber.org/zap v1.26.0
	google.golang.org/grpc v1.81.1
	google.golang.org/protobuf v1.36.11
)

require (
	github.com/go-ole/go-ole v1.3.0 // indirect
	github.com/gorilla/websocket v1.5.3 // indirect
	github.com/webview/webview_go v0.0.0-20240831120633-6173450d4dd6 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20260226221140-a57be14db171 // indirect
)

require (
	github.com/dlclark/regexp2 v1.11.4 // indirect
	github.com/go-sourcemap/sourcemap v2.1.3+incompatible // indirect
	github.com/google/pprof v0.0.0-20230207041349-798e818bf904 // indirect
	github.com/hashicorp/hcl v1.0.0 // indirect
	github.com/magiconair/properties v1.8.7 // indirect
	github.com/mitchellh/mapstructure v1.5.0
	github.com/pelletier/go-toml/v2 v2.1.0
	github.com/sagikazarmark/locafero v0.4.0 // indirect
	github.com/sagikazarmark/slog-shim v0.1.0 // indirect
	github.com/sourcegraph/conc v0.3.0 // indirect
	github.com/spf13/afero v1.11.0 // indirect
	github.com/spf13/cast v1.6.0 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
	github.com/subosito/gotenv v1.6.0 // indirect
	go.uber.org/multierr v1.10.0 // indirect
	golang.org/x/exp v0.0.0-20230905200255-921286631fa9 // indirect
	golang.org/x/image v0.42.0 // indirect
	golang.org/x/net v0.55.0 // indirect
	golang.org/x/sys v0.45.0 // indirect
	golang.org/x/text v0.38.0 // indirect
	gopkg.in/ini.v1 v1.67.0 // indirect
	gopkg.in/yaml.v3 v3.0.1
)

replace (
	YaraFlow/internal/browser => ./internal/browser
	YaraFlow/internal/bus => ./internal/bus
	YaraFlow/internal/dedupe => ./internal/dedupe
	YaraFlow/internal/hook => ./internal/hook
	YaraFlow/internal/knowledge => ./internal/knowledge
	YaraFlow/internal/logger => ./internal/logger
	YaraFlow/internal/metrics => ./internal/metrics
	YaraFlow/internal/monitor => ./internal/monitor
	YaraFlow/internal/personality => ./internal/personality
	YaraFlow/internal/platform => ./internal/platform
	YaraFlow/internal/pool => ./internal/pool
	YaraFlow/internal/search => ./internal/search
	YaraFlow/internal/tracing => ./internal/tracing
)
