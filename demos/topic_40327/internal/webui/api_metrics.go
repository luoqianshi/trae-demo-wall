package webui

import (
	"expvar"
	"fmt"
	"net/http"
	"runtime"
	"strings"
)

// handlePrometheusMetrics Prometheus 格式指标端点
// 将 expvar 发布的指标转换为 Prometheus exposition format，供 Prometheus/Grafana 抓取
func (s *Server) handlePrometheusMetrics(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")

	var sb strings.Builder

	// 收集 expvar 发布的指标
	expvar.Do(func(kv expvar.KeyValue) {
		name := kv.Key
		val := kv.Value.String()

		// 跳过非指标项（如 command line、memstats 详细信息）
		if name == "cmdline" || name == "memstats" {
			return
		}

		// 解析数值
		var numVal float64
		if _, err := fmt.Sscanf(val, "%f", &numVal); err != nil {
			return
		}

		// 写入 Prometheus 格式
		sb.WriteString(fmt.Sprintf("# TYPE %s gauge\n", name))
		sb.WriteString(fmt.Sprintf("%s %g\n", name, numVal))
	})

	// 补充 Go 运行时指标
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	sb.WriteString("# TYPE yaraflow_heap_alloc_bytes gauge\n")
	sb.WriteString(fmt.Sprintf("yaraflow_heap_alloc_bytes %d\n", m.Alloc))
	sb.WriteString("# TYPE yaraflow_heap_sys_bytes gauge\n")
	sb.WriteString(fmt.Sprintf("yaraflow_heap_sys_bytes %d\n", m.HeapSys))
	sb.WriteString("# TYPE yaraflow_gc_count gauge\n")
	sb.WriteString(fmt.Sprintf("yaraflow_gc_count %d\n", m.NumGC))

	w.Write([]byte(sb.String()))
}
