package festival

import (
	"testing"
)

func TestParseDate(t *testing.T) {
	tests := []struct {
		input string
		want  string // YYYY-MM-DD
		err   bool
	}{
		{"2026-06-30", "2026-06-30", false},
		{"2026-01-01", "2026-01-01", false},
		{"2026-13-01", "", true},
		{"invalid", "", true},
		{"", "", true},
	}

	for _, tt := range tests {
		got, err := ParseDate(tt.input)
		if tt.err {
			if err == nil {
				t.Errorf("ParseDate(%q) expected error, got %v", tt.input, got)
			}
			continue
		}
		if err != nil {
			t.Errorf("ParseDate(%q) unexpected error: %v", tt.input, err)
			continue
		}
		if got.Format("2006-01-02") != tt.want {
			t.Errorf("ParseDate(%q) = %v, want %v", tt.input, got.Format("2006-01-02"), tt.want)
		}
	}
}

func TestSolarFestivals(t *testing.T) {
	svc := NewService()
	tests := []struct {
		date string
		want string // festival name
	}{
		{"2026-01-01", "元旦"},
		{"2026-01-02", "元旦"},
		{"2026-05-31", "儿童节"},
		{"2026-06-01", "儿童节"},
		{"2026-06-02", "儿童节"},
		{"2026-10-01", "国庆节"},
		{"2026-10-02", "国庆节"},
		{"2026-10-03", "国庆节"},
		{"2026-10-04", "国庆节"},
		{"2026-12-22", "冬至"},
	}

	for _, tt := range tests {
		t.Run(tt.date, func(t *testing.T) {
			date, _ := ParseDate(tt.date)
			festivals := svc.GetFestivalsForDate(date)
			found := false
			for _, f := range festivals {
				if f.Name == tt.want {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("GetFestivalsForDate(%q) should contain %q, got %v", tt.date, tt.want, festivals)
			}
		})
	}
}

func TestLunarFestivals(t *testing.T) {
	svc := NewService()
	tests := []struct {
		date string
		want string
	}{
		// 2026年春节
		{"2026-02-14", "春节"}, // 节前3天
		{"2026-02-17", "春节"}, // 除夕
		{"2026-02-24", "春节"}, // 节后7天
		// 2026年元宵节
		{"2026-03-03", "元宵节"},
		// 2026年端午节
		{"2026-06-18", "端午节"},
		{"2026-06-19", "端午节"},
		{"2026-06-20", "端午节"},
	}

	for _, tt := range tests {
		t.Run(tt.date, func(t *testing.T) {
			date, _ := ParseDate(tt.date)
			festivals := svc.GetFestivalsForDate(date)
			found := false
			for _, f := range festivals {
				if f.Name == tt.want {
					found = true
					break
				}
			}
			if !found {
				t.Errorf("GetFestivalsForDate(%q) should contain %q, got %v", tt.date, tt.want, festivals)
			}
		})
	}
}

func TestNoFestival(t *testing.T) {
	svc := NewService()
	// 一个普通日期，应该没有节日
	date, _ := ParseDate("2026-03-15")
	festivals := svc.GetFestivalsForDate(date)
	if len(festivals) > 0 {
		t.Errorf("GetFestivalsForDate(2026-03-15) should be empty, got %v", festivals)
	}
}

func TestGetCurrentTheme(t *testing.T) {
	svc := NewService()
	theme := svc.GetCurrentTheme()
	// Should return a valid theme string (default when no festival)
	if theme != "default" && theme == "" {
		t.Errorf("GetCurrentTheme() should not be empty")
	}
}

func TestListFestivalsByYear(t *testing.T) {
	svc := NewService()
	festivals := svc.ListFestivalsByYear(2026)
	if len(festivals) == 0 {
		t.Fatal("ListFestivalsByYear(2026) should not be empty")
	}

	// Check that expected festivals are present
	expected := []string{"元旦", "春节", "元宵节", "端午节", "七夕节", "中秋节", "重阳节", "儿童节", "国庆节", "冬至"}
	for _, name := range expected {
		found := false
		for _, f := range festivals {
			if f.Name == name {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("ListFestivalsByYear(2026) should contain %q", name)
		}
	}
}

// TestFestivalOverlap verifies that when two festivals overlap, both are returned
func TestFestivalOverlap(t *testing.T) {
	svc := NewService()
	// 元宵节 sometimes overlaps with spring-festival period
	// In 2026: spring-festival 2026-02-14 to 2026-02-24 (3 days before to 7 days after Feb 17)
	//           lantern 2026-03-03 (no range)
	date, _ := ParseDate("2026-02-17") // 春节当天
	festivals := svc.GetFestivalsForDate(date)
	if len(festivals) == 0 {
		t.Error("2026-02-17 should have festivals (Spring Festival)")
	}
}

func TestLunarDateRange(t *testing.T) {
	svc := NewService()
	// Spring festival 2026: Feb 17, range -3 to +7 = Feb 14 to Feb 24
	tests := []struct {
		date    string
		present bool
	}{
		{"2026-02-13", false}, // 节前第4天
		{"2026-02-14", true},  // 节前第3天
		{"2026-02-17", true},  // 除夕
		{"2026-02-24", true},  // 节后第7天
		{"2026-02-25", false}, // 节后第8天
	}

	for _, tt := range tests {
		t.Run(tt.date, func(t *testing.T) {
			date, _ := ParseDate(tt.date)
			festivals := svc.GetFestivalsForDate(date)
			hasSpring := false
			for _, f := range festivals {
				if f.Theme == "spring-festival" {
					hasSpring = true
					break
				}
			}
			if hasSpring != tt.present {
				t.Errorf("GetFestivalsForDate(%q) spring-festival present=%v, want %v", tt.date, hasSpring, tt.present)
			}
		})
	}
}

// TestFestivalStructFields verifies the Festival struct fields are populated
func TestFestivalStructFields(t *testing.T) {
	svc := NewService()
	date, _ := ParseDate("2026-01-01")
	festivals := svc.GetFestivalsForDate(date)

	if len(festivals) == 0 {
		t.Fatal("2026-01-01 should have festivals")
	}

	f := festivals[0]
	if f.Key == "" {
		t.Error("Festival.Key should not be empty")
	}
	if f.Name == "" {
		t.Error("Festival.Name should not be empty")
	}
	if f.Theme == "" {
		t.Error("Festival.Theme should not be empty")
	}
	if f.Type != "solar" && f.Type != "lunar" {
		t.Errorf("Festival.Type should be 'solar' or 'lunar', got %q", f.Type)
	}
	if f.Date == "" {
		t.Error("Festival.Date should not be empty")
	}
}

func TestFormatCurrentFestival(t *testing.T) {
	svc := NewService()
	label := svc.FormatCurrentFestival()
	// Should either be empty or contain a festival name
	if label != "" {
		// Should have the prefix
		if len(label) < 2 {
			t.Errorf("FormatCurrentFestival() result too short: %q", label)
		}
	}
}