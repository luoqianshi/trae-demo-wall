package download

import (
	"context"
	"fmt"
	"net/http"
	"regexp"

	"YaraFlow/internal/logger"
)

// MirrorRule 镜像规则：URL 模式匹配后，生成镜像 URL 列表
type MirrorRule struct {
	Pattern   string   // 正则表达式，匹配原始 URL
	Templates []string // 镜像 URL 模板，$1, $2... 对应捕获组
}

// 内置镜像规则（已知开源项目）
var builtinMirrors = []MirrorRule{
	// gyan.dev ffmpeg → GitHub Releases CDN（国内速度快很多）
	{
		Pattern: `^https://www\.gyan\.dev/ffmpeg/builds/packages/([^/]+)$`,
		Templates: []string{
			"https://github.com/GyanD/codexffmpeg/releases/latest/download/$1",
		},
	},
}

// findMirrors 根据 URL 匹配镜像规则，返回所有候选 URL（原始 URL 排第一）
func findMirrors(url string) []string {
	urls := []string{url}
	for _, rule := range builtinMirrors {
		re, err := regexp.Compile(rule.Pattern)
		if err != nil {
			continue
		}
		matches := re.FindStringSubmatch(url)
		if matches == nil {
			continue
		}
		for _, tmpl := range rule.Templates {
			mirror := tmpl
			for i := 1; i < len(matches); i++ {
				mirror = regexp.MustCompile(fmt.Sprintf(`\$%d`, i)).
					ReplaceAllString(mirror, matches[i])
			}
			urls = append(urls, mirror)
		}
	}
	return urls
}

// raceDownload 竞速下载：同时尝试多个 URL，取最先响应的
// 返回获胜 URL 的响应体，以及获胜 URL
func raceDownload(ctx context.Context, urls []string) (*http.Response, string, error) {
	if len(urls) == 1 {
		// 只有一个 URL，直接下载
		req, err := http.NewRequestWithContext(ctx, "GET", urls[0], nil)
		if err != nil {
			return nil, "", err
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
		resp, err := httpClient.Do(req)
		if err != nil {
			return nil, "", err
		}
		if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusPartialContent {
			resp.Body.Close()
			return nil, "", fmt.Errorf("HTTP状态码: %d", resp.StatusCode)
		}
		return resp, urls[0], nil
	}

	// 多个候选 URL，竞速
	type result struct {
		resp *http.Response
		url  string
		err  error
	}

	raceCtx, cancel := context.WithCancel(ctx)
	defer cancel()

	resultCh := make(chan result, len(urls))

	for _, u := range urls {
		go func(url string) {
			req, err := http.NewRequestWithContext(raceCtx, "GET", url, nil)
			if err != nil {
				resultCh <- result{err: err, url: url}
				return
			}
			req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
			resp, err := httpClient.Do(req)
			if err != nil {
				resultCh <- result{err: err, url: url}
				return
			}
			if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusPartialContent {
				resp.Body.Close()
				resultCh <- result{err: fmt.Errorf("HTTP状态码: %d", resp.StatusCode), url: url}
				return
			}
			resultCh <- result{resp: resp, url: url}
		}(u)
	}

	var firstErr error
	remaining := len(urls)

	for remaining > 0 {
		select {
		case <-ctx.Done():
			return nil, "", ctx.Err()
		case r := <-resultCh:
			remaining--
			if r.err == nil {
				// 成功！取消其他请求
				cancel()
				// 清理其他 goroutine 的结果
				go func() {
					for remaining > 0 {
						other := <-resultCh
						remaining--
						if other.resp != nil {
							other.resp.Body.Close()
						}
					}
				}()
				return r.resp, r.url, nil
			}
			if firstErr == nil {
				firstErr = r.err
			}
		}
	}

	return nil, "", fmt.Errorf("所有镜像均失败 (首错: %w)", firstErr)
}

// resolveWithMirrors 尝试用镜像竞速下载，如果镜像都失败则回退到原始 URL
func resolveWithMirrors(ctx context.Context, url string) (*http.Response, string, error) {
	candidates := findMirrors(url)
	if len(candidates) > 1 {
		logger.Sugar.Infow("[下载] 发现镜像，启动竞速下载", "original", url, "candidates", len(candidates))
	}
	return raceDownload(ctx, candidates)
}

// RaceGet 竞速 GET 请求，返回响应体和实际使用的 URL
func RaceGet(ctx context.Context, url string) (*http.Response, string, error) {
	return resolveWithMirrors(ctx, url)
}

// raceHead 竞速 HEAD 请求，返回最快响应的 URL
// 用于多线程下载前选出最佳镜像，后续所有分段统一使用该 URL
func raceHead(candidates []string) string {
	if len(candidates) <= 1 {
		return candidates[0]
	}

	type result struct {
		url string
	}
	resultCh := make(chan result, len(candidates))
	ctx, cancel := context.WithTimeout(context.Background(), responseHeaderTimeout)
	defer cancel()

	for _, u := range candidates {
		go func(url string) {
			req, err := http.NewRequestWithContext(ctx, "HEAD", url, nil)
			if err != nil {
				return
			}
			req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
			resp, err := httpClient.Do(req)
			if err != nil {
				return
			}
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				select {
				case resultCh <- result{url: url}:
				default:
				}
			}
		}(u)
	}

	// 等待第一个成功的结果
	select {
	case r := <-resultCh:
		return r.url
	case <-ctx.Done():
		return candidates[0] // 超时回退到原始 URL
	}
}