package hook

import (
	"sync"
	"testing"
	"time"

	"YaraFlow/internal/platform"
)

func TestHookManagerRegisterAndTrigger(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        make(map[string]bool),
		mode:        "blacklist",
		rateLimiter: &rateLimitState{},
	}

	var called bool
	var mu sync.Mutex

	hm.Register(HookChatReceiveBeforeProcess, HookHandlerFunc(func(event HookEvent) HookResult {
		mu.Lock()
		called = true
		mu.Unlock()
		return HookResult{AllowContinue: true}
	}), 5*time.Second, true)

	result, err := hm.Trigger(HookChatReceiveBeforeProcess, &platform.Message{SenderID: "u1"}, nil)
	if err != nil {
		t.Fatalf("Trigger failed: %v", err)
	}
	if !result.AllowContinue {
		t.Error("hook should allow continue")
	}

	mu.Lock()
	if !called {
		t.Error("handler should have been called")
	}
	mu.Unlock()
}

func TestHookManagerTriggerNoHandlers(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        make(map[string]bool),
		mode:        "blacklist",
		rateLimiter: &rateLimitState{},
	}

	result, err := hm.Trigger(HookChatReceiveBeforeProcess, nil, nil)
	if err != nil {
		t.Fatalf("Trigger failed: %v", err)
	}
	if !result.AllowContinue {
		t.Error("no handlers should still allow continue")
	}
}

func TestHookManagerUnregister(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        make(map[string]bool),
		mode:        "blacklist",
		rateLimiter: &rateLimitState{},
	}

	handler := HookHandlerFunc(func(event HookEvent) HookResult {
		return HookResult{AllowContinue: true}
	})
	hm.Register(HookChatReceiveBeforeProcess, handler, 5*time.Second, true)

	if len(hm.hooks[HookChatReceiveBeforeProcess]) != 1 {
		t.Fatal("handler should be registered")
	}

	hm.Unregister(HookChatReceiveBeforeProcess, handler)

	if len(hm.hooks[HookChatReceiveBeforeProcess]) != 0 {
		t.Fatal("handler should be unregistered")
	}
}

func TestHookManagerAbort(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        make(map[string]bool),
		mode:        "blacklist",
		rateLimiter: &rateLimitState{},
	}

	var secondCalled bool
	hm.Register(HookChatReceiveBeforeProcess, HookHandlerFunc(func(event HookEvent) HookResult {
		return HookResult{AllowContinue: false}
	}), 5*time.Second, true)
	hm.Register(HookChatReceiveBeforeProcess, HookHandlerFunc(func(event HookEvent) HookResult {
		secondCalled = true
		return HookResult{AllowContinue: true}
	}), 5*time.Second, true)

	result, err := hm.Trigger(HookChatReceiveBeforeProcess, &platform.Message{SenderID: "u1"}, nil)
	if err != nil {
		t.Fatalf("Trigger failed: %v", err)
	}
	if result.AllowContinue {
		t.Error("first handler should have aborted")
	}
	if secondCalled {
		t.Error("second handler should not have been called")
	}
}

func TestHookManagerModifiedData(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        make(map[string]bool),
		mode:        "blacklist",
		rateLimiter: &rateLimitState{},
	}

	hm.Register(HookSendServiceAfterBuildMsg, HookHandlerFunc(func(event HookEvent) HookResult {
		modified := &platform.Message{
			SenderID: event.Message.SenderID,
			Content:  "modified",
		}
		return HookResult{AllowContinue: true, ModifiedData: modified}
	}), 5*time.Second, true)

	original := &platform.Message{SenderID: "u1", Content: "original"}
	result, err := hm.Trigger(HookSendServiceAfterBuildMsg, original, nil)
	if err != nil {
		t.Fatalf("Trigger failed: %v", err)
	}
	if !result.AllowContinue {
		t.Error("should allow continue")
	}
}

func TestHookManagerBlacklist(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        map[string]bool{"blocked_user": true},
		mode:        "blacklist",
		rateLimiter: &rateLimitState{},
	}
	hm.RegisterBuiltinHooks()

	result, err := hm.Trigger(HookChatReceiveBeforeProcess, &platform.Message{
		SenderID:   "blocked_user",
		SenderName: "test",
	}, nil)
	if err != nil {
		t.Fatalf("Trigger failed: %v", err)
	}
	if result.AllowContinue {
		t.Error("blacklisted user should be blocked")
	}

	result, err = hm.Trigger(HookChatReceiveBeforeProcess, &platform.Message{
		SenderID:   "normal_user",
		SenderName: "test",
	}, nil)
	if err != nil {
		t.Fatalf("Trigger failed: %v", err)
	}
	if !result.AllowContinue {
		t.Error("normal user should not be blocked")
	}
}

func TestHookManagerWhitelist(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        map[string]bool{"allowed_user": true},
		mode:        "whitelist",
		rateLimiter: &rateLimitState{},
	}
	hm.RegisterBuiltinHooks()

	result, err := hm.Trigger(HookChatReceiveBeforeProcess, &platform.Message{
		SenderID:   "allowed_user",
		SenderName: "test",
	}, nil)
	if err != nil {
		t.Fatalf("Trigger failed: %v", err)
	}
	if !result.AllowContinue {
		t.Error("whitelisted user should be allowed")
	}

	result, err = hm.Trigger(HookChatReceiveBeforeProcess, &platform.Message{
		SenderID:   "other_user",
		SenderName: "test",
	}, nil)
	if err != nil {
		t.Fatalf("Trigger failed: %v", err)
	}
	if result.AllowContinue {
		t.Error("non-whitelisted user should be blocked")
	}
}

func TestHookManagerAddRemoveList(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        make(map[string]bool),
		mode:        "blacklist",
		rateLimiter: &rateLimitState{},
	}

	hm.AddToList("u1")
	if !hm.IsUserBlocked("u1") {
		t.Error("u1 should be blocked after AddToList in blacklist mode")
	}

	hm.RemoveFromList("u1")
	if hm.IsUserBlocked("u1") {
		t.Error("u1 should not be blocked after RemoveFromList")
	}
}

func TestHookManagerRateLimit(t *testing.T) {
	hm := &HookManager{
		hooks: make(map[HookType][]*HookEntry),
		list:  make(map[string]bool),
		mode:  "blacklist",
		rateLimiter: &rateLimitState{
			enabled:    true,
			maxPerMin:  3,
			minCounter: make(map[string][]time.Time),
		},
	}

	for i := 0; i < 3; i++ {
		if !hm.checkRateLimit("u1") {
			t.Errorf("checkRateLimit should allow call %d", i+1)
		}
	}

	if hm.checkRateLimit("u1") {
		t.Error("checkRateLimit should block 4th call within a minute")
	}
}

func TestHookManagerBeforeProcessNilMessage(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        make(map[string]bool),
		mode:        "blacklist",
		rateLimiter: &rateLimitState{},
	}

	result := hm.beforeProcessHandler(HookEvent{})
	if !result.AllowContinue {
		t.Error("nil message should be allowed")
	}
}

func TestHookManagerCommandBeforeExecute(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        map[string]bool{"blocked_user": true},
		mode:        "blacklist",
		rateLimiter: &rateLimitState{},
	}

	result := hm.commandBeforeExecuteHandler(HookEvent{
		Message: &platform.Message{SenderID: "blocked_user"},
		Context: map[string]interface{}{"command_name": "test_cmd"},
	})
	if result.AllowContinue {
		t.Error("blocked user should not execute commands")
	}
}

func TestHookManagerAfterBuildMessageTruncation(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        make(map[string]bool),
		mode:        "blacklist",
		rateLimiter: &rateLimitState{},
	}

	longContent := make([]byte, 1000)
	for i := range longContent {
		longContent[i] = 'a'
	}
	msg := &platform.Message{Content: string(longContent)}
	result := hm.afterBuildMessageHandler(HookEvent{Message: msg})
	if !result.AllowContinue {
		t.Error("truncation should still allow continue")
	}
}

func TestHookManagerBeforeSendEmpty(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        make(map[string]bool),
		mode:        "blacklist",
		rateLimiter: &rateLimitState{},
	}

	msg := &platform.Message{Content: ""}
	result := hm.beforeSendHandler(HookEvent{Message: msg})
	if result.AllowContinue {
		t.Error("empty content should be blocked from sending")
	}
}

func TestHookManagerLoadConfig(t *testing.T) {
	hm := &HookManager{
		hooks:       make(map[HookType][]*HookEntry),
		list:        make(map[string]bool),
		mode:        "blacklist",
		rateLimiter: &rateLimitState{},
	}

	cfg := &Config{
		Mode: "blacklist",
		List: []string{"u1", "u2"},
		RateLimit: RateLimitConfig{
			Enabled:    true,
			MaxPerMin:  10,
			MaxPerHour: 50,
		},
	}

	hm.LoadConfig(cfg)

	if !hm.IsUserBlocked("u1") {
		t.Error("u1 should be blocked")
	}
	if !hm.IsUserBlocked("u2") {
		t.Error("u2 should be blocked")
	}
	if hm.IsUserBlocked("u3") {
		t.Error("u3 should not be blocked")
	}
	if hm.mode != "blacklist" {
		t.Errorf("mode = %s, want blacklist", hm.mode)
	}
	if !hm.rateLimiter.enabled {
		t.Error("rate limiter should be enabled")
	}
	if hm.rateLimiter.maxPerMin != 10 {
		t.Errorf("maxPerMin = %d, want 10", hm.rateLimiter.maxPerMin)
	}
}

func TestRegisterUnregisterHook(t *testing.T) {
	handler := HookHandlerFunc(func(event HookEvent) HookResult {
		return HookResult{AllowContinue: true}
	})
	RegisterHook(HookChatReceiveBeforeProcess, handler, 5*time.Second, true)

	entries := DefaultHookManager.hooks[HookChatReceiveBeforeProcess]
	found := false
	for _, e := range entries {
		if e.Handler.(HookHandlerFunc) != nil {
			found = true
			break
		}
	}
	if !found {
		t.Error("handler should be registered via convenience function")
	}

	UnregisterHook(HookChatReceiveBeforeProcess, handler)
}
