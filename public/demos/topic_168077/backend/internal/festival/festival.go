package festival

import (
	"fmt"
	"time"
)

// Festival 节日信息
type Festival struct {
	Key       string `json:"key"`
	Name      string `json:"name"`
	Date      string `json:"date"` // YYYY-MM-DD
	Type      string `json:"type"` // solar / lunar
	IsStart   bool   `json:"is_start"`
	Theme     string `json:"theme"`
}

// 农历节日基准日期（公历年月日）
// 数据来源：天文年鉴，覆盖2025-2030年
var lunarFestivals = map[string]map[int]string{
	// 春节（正月初一）
	"spring-festival": {
		2025: "2025-01-29",
		2026: "2026-02-17",
		2027: "2027-02-06",
		2028: "2028-01-26",
		2029: "2029-02-13",
		2030: "2030-02-03",
	},
	// 元宵节（正月十五）
	"lantern": {
		2025: "2025-02-12",
		2026: "2026-03-03",
		2027: "2027-02-20",
		2028: "2028-02-09",
		2029: "2029-02-27",
		2030: "2030-02-17",
	},
	// 端午节（五月初五）
	"dragon-boat": {
		2025: "2025-05-31",
		2026: "2026-06-19",
		2027: "2027-06-09",
		2028: "2028-05-28",
		2029: "2029-06-16",
		2030: "2030-06-05",
	},
	// 七夕节（七月初七）
	"qixi": {
		2025: "2025-08-29",
		2026: "2026-08-19",
		2027: "2027-08-08",
		2028: "2028-08-26",
		2029: "2029-08-16",
		2030: "2030-08-05",
	},
	// 中秋节（八月十五）
	"mid-autumn": {
		2025: "2025-10-06",
		2026: "2026-09-25",
		2027: "2027-09-15",
		2028: "2028-10-03",
		2029: "2029-09-22",
		2030: "2030-09-11",
	},
	// 重阳节（九月初九）
	"double-ninth": {
		2025: "2025-10-29",
		2026: "2026-10-18",
		2027: "2027-10-08",
		2028: "2028-10-27",
		2029: "2029-10-16",
		2030: "2030-10-05",
	},
}

// 各节日对应的主题和时长（节前N天 ~ 节后N天）
var festivalMeta = map[string]struct {
	Name  string
	Theme string
	DaysBefore int
	DaysAfter  int
}{
	"spring-festival": {"春节", "spring-festival", 3, 7},
	"lantern":        {"元宵节", "spring-festival", 0, 0},
	"dragon-boat":    {"端午节", "dragon-boat", 1, 1},
	"mid-autumn":     {"中秋节", "mid-autumn", 1, 1},
	"qixi":           {"七夕节", "qixi", 0, 0},
	"double-ninth":   {"重阳节", "double-ninth", 0, 0},
}

// 阳历固定节日
var solarFestivals = []struct {
	Name    string
	Month   int
	Day     int
	Theme   string
	DaysBefore int
	DaysAfter  int
}{
	{"元旦", 1, 1, "new-year", 0, 1},
	{"儿童节", 6, 1, "children-day", 1, 1},
	{"国庆节", 10, 1, "national-day", 0, 3},
	{"冬至", 12, 22, "winter-solstice", 0, 0},
}

// Service 节日计算服务
type Service struct{}

func NewService() *Service { return &Service{} }

// Now 返回当前时间
func Now() time.Time { return time.Now() }

// ParseDate 解析 YYYY-MM-DD 格式日期
func ParseDate(s string) (time.Time, error) {
	return time.Parse("2006-01-02", s)
}

// GetFestivalsForDate 获取指定日期的所有活跃节日
func (s *Service) GetFestivalsForDate(t time.Time) []Festival {
	var results []Festival
	ymd := t.Format("2006-01-02")
	year := t.Year()

	// 查阳历节日
	for _, sf := range solarFestivals {
		festivalDate := time.Date(year, time.Month(sf.Month), sf.Day, 0, 0, 0, 0, t.Location())
		start := festivalDate.AddDate(0, 0, -sf.DaysBefore)
		end := festivalDate.AddDate(0, 0, sf.DaysAfter)
		if !t.Before(start) && !t.After(end) {
			startDate := start.Format("2006-01-02")
			results = append(results, Festival{
				Key: sf.Theme, Name: sf.Name, Date: startDate,
				Type: "solar", IsStart: ymd == startDate, Theme: sf.Theme,
			})
		}
	}

	// 查农历节日
	for key, years := range lunarFestivals {
		dateStr, ok := years[year]
		if !ok {
			continue
		}
		festivalDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			continue
		}
		meta := festivalMeta[key]
		start := festivalDate.AddDate(0, 0, -meta.DaysBefore)
		end := festivalDate.AddDate(0, 0, meta.DaysAfter)
		if !t.Before(start) && !t.After(end) {
			startDate := start.Format("2006-01-02")
			results = append(results, Festival{
				Key: meta.Theme, Name: meta.Name, Date: startDate,
				Type: "lunar", IsStart: ymd == startDate, Theme: meta.Theme,
			})
		}
	}

	return results
}

// GetCurrentTheme 获取当前日期应该使用的主题
func (s *Service) GetCurrentTheme() string {
	festivals := s.GetFestivalsForDate(time.Now())
	if len(festivals) > 0 {
		return festivals[0].Theme
	}
	return "default"
}

// GetFestivalNames 获取当前节日名称列表
func (s *Service) GetFestivalNames() []string {
	festivals := s.GetFestivalsForDate(time.Now())
	names := make([]string, len(festivals))
	for i, f := range festivals {
		names[i] = f.Name
	}
	return names
}

// ListFestivalsByYear 获取某年的所有节日
func (s *Service) ListFestivalsByYear(year int) []Festival {
	var all []Festival
	for _, sf := range solarFestivals {
		d := time.Date(year, time.Month(sf.Month), sf.Day, 0, 0, 0, 0, time.UTC)
		start := d.AddDate(0, 0, -sf.DaysBefore)
		all = append(all, Festival{
			Key: sf.Theme, Name: sf.Name,
			Date: d.Format("2006-01-02"),
			Type: "solar", IsStart: true, Theme: sf.Theme,
		})
		if sf.DaysBefore > 0 || sf.DaysAfter > 0 {
			_ = start // 标记范围起始
		}
	}
	for key, years := range lunarFestivals {
		dateStr, ok := years[year]
		if !ok {
			continue
		}
		meta := festivalMeta[key]
		all = append(all, Festival{
			Key: meta.Theme, Name: meta.Name,
			Date: dateStr, Type: "lunar", IsStart: true, Theme: meta.Theme,
		})
	}
	return all
}

// FormatCurrentFestival 格式化当前节日显示文本
func (s *Service) FormatCurrentFestival() string {
	festivals := s.GetFestivalsForDate(time.Now())
	if len(festivals) == 0 {
		return ""
	}
	names := make([]string, len(festivals))
	for i, f := range festivals {
		names[i] = f.Name
	}
	if len(names) == 1 {
		return fmt.Sprintf("🎉 %s", names[0])
	}
	return fmt.Sprintf("🎉 %s", names[0])
}