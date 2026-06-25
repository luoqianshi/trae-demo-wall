package logger

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"
)

type DailyRotateWriter struct {
	mu         sync.Mutex
	dir        string
	baseName   string
	ext        string
	maxDays    int
	currentDay string
	file       *os.File
}

func NewDailyRotateWriter(filePath string, maxDays int) (*DailyRotateWriter, error) {
	dir := filepath.Dir(filePath)
	ext := filepath.Ext(filePath)
	baseName := strings.TrimSuffix(filepath.Base(filePath), ext)

	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, err
	}

	w := &DailyRotateWriter{
		dir:      dir,
		baseName: baseName,
		ext:      ext,
		maxDays:  maxDays,
	}

	if err := w.rotate(); err != nil {
		return nil, err
	}

	if maxDays > 0 {
		go w.cleanupLoop()
	}

	return w, nil
}

func (w *DailyRotateWriter) Write(p []byte) (n int, err error) {
	w.mu.Lock()
	defer w.mu.Unlock()

	today := time.Now().Format("2006-01-02")
	if today != w.currentDay {
		if err := w.rotate(); err != nil {
			return 0, err
		}
	}

	return w.file.Write(p)
}

func (w *DailyRotateWriter) rotate() error {
	if w.file != nil {
		w.file.Close()
	}

	today := time.Now().Format("2006-01-02")
	w.currentDay = today

	fileName := fmt.Sprintf("%s-%s%s", w.baseName, today, w.ext)
	filePath := filepath.Join(w.dir, fileName)

	file, err := os.OpenFile(filePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return err
	}

	w.file = file

	go w.cleanup()

	return nil
}

func (w *DailyRotateWriter) cleanup() {
	if w.maxDays <= 0 {
		return
	}

	entries, err := os.ReadDir(w.dir)
	if err != nil {
		return
	}

	cutoff := time.Now().AddDate(0, 0, -w.maxDays)
	prefix := w.baseName + "-"

	var oldFiles []string
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		name := entry.Name()
		if !strings.HasPrefix(name, prefix) || !strings.HasSuffix(name, w.ext) {
			continue
		}
		dateStr := strings.TrimPrefix(name, prefix)
		dateStr = strings.TrimSuffix(dateStr, w.ext)
		date, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			continue
		}
		if date.Before(cutoff) {
			oldFiles = append(oldFiles, filepath.Join(w.dir, name))
		}
	}

	sort.Strings(oldFiles)
	for _, f := range oldFiles {
		os.Remove(f)
	}
}

func (w *DailyRotateWriter) cleanupLoop() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()
	for range ticker.C {
		w.cleanup()
	}
}

func (w *DailyRotateWriter) Close() error {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.file != nil {
		return w.file.Close()
	}
	return nil
}

func (w *DailyRotateWriter) Sync() error {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.file != nil {
		return w.file.Sync()
	}
	return nil
}