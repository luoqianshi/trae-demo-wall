package plugin

import (
	"testing"
	"time"
)

// ── NewSandbox + RunString 基础执行 ──

func TestSandbox_RunString_Basic(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	val, err := s.RunString("1 + 1")
	if err != nil {
		t.Fatalf("执行失败: %v", err)
	}
	if val.ToInteger() != 2 {
		t.Errorf("1+1 应等于2，got=%v", val)
	}
}

func TestSandbox_RunString_StringResult(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	val, err := s.RunString("'hello' + ' ' + 'world'")
	if err != nil {
		t.Fatalf("执行失败: %v", err)
	}
	if val.String() != "hello world" {
		t.Errorf("got=%q want=%q", val.String(), "hello world")
	}
}

// ── console 注入 ──

func TestSandbox_ConsoleLog(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	_, err := s.RunString("console.log('test message')")
	if err != nil {
		t.Errorf("console.log 不应报错: %v", err)
	}
}

func TestSandbox_ConsoleWarn(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	_, err := s.RunString("console.warn('warn message')")
	if err != nil {
		t.Errorf("console.warn 不应报错: %v", err)
	}
}

func TestSandbox_ConsoleError(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	_, err := s.RunString("console.error('error message')")
	if err != nil {
		t.Errorf("console.error 不应报错: %v", err)
	}
}

func TestSandbox_ConsoleDebug(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	_, err := s.RunString("console.debug('debug message')")
	if err != nil {
		t.Errorf("console.debug 不应报错: %v", err)
	}
}

// ── setTimeout / setInterval 应 panic ──

func TestSandbox_SetTimeout_Panics(t *testing.T) {
	s := NewSandbox(2 * time.Second)
	_, err := s.RunString("setTimeout(function(){}, 0)")
	if err == nil {
		t.Error("setTimeout 调用应返回错误（goja TypeError）")
	}
}

func TestSandbox_SetInterval_Panics(t *testing.T) {
	s := NewSandbox(2 * time.Second)
	_, err := s.RunString("setInterval(function(){}, 0)")
	if err == nil {
		t.Error("setInterval 调用应返回错误（goja TypeError）")
	}
}

// ── Set / Get ──

func TestSandbox_SetGet(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	s.Set("myVar", 42)
	val := s.Get("myVar")
	if val.ToInteger() != 42 {
		t.Errorf("got=%v want=42", val)
	}
}

func TestSandbox_SetGet_String(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	s.Set("myStr", "hello")
	val := s.Get("myStr")
	if val.String() != "hello" {
		t.Errorf("got=%q want=%q", val.String(), "hello")
	}
}

func TestSandbox_Set_UseInScript(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	s.Set("x", 10)
	val, err := s.RunString("x * 2")
	if err != nil {
		t.Fatalf("执行失败: %v", err)
	}
	if val.ToInteger() != 20 {
		t.Errorf("x*2 应等于20，got=%v", val)
	}
}

func TestSandbox_Get_Undefined(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	val := s.Get("nonExistentVar")
	// goja 对不存在的变量返回 nil
	if val != nil {
		t.Errorf("不存在的变量应返回 nil，got=%v", val)
	}
}

// ── Compile + RunProgram ──

func TestSandbox_CompileAndRunProgram(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	prog, err := s.Compile("test", "40 + 2")
	if err != nil {
		t.Fatalf("编译失败: %v", err)
	}
	if prog == nil {
		t.Fatal("编译结果不应为 nil")
	}
	val, err := s.RunProgram(prog)
	if err != nil {
		t.Fatalf("执行编译程序失败: %v", err)
	}
	if val.ToInteger() != 42 {
		t.Errorf("got=%v want=42", val)
	}
}

func TestSandbox_Compile_InvalidSyntax(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	_, err := s.Compile("test", "this is not valid javascript !!!")
	if err == nil {
		t.Error("语法错误应返回编译错误")
	}
}

// ── Interrupt ──

func TestSandbox_Interrupt_BlocksFurtherExecution(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	// 先正常执行一次
	_, err := s.RunString("1 + 1")
	if err != nil {
		t.Fatalf("首次执行不应失败: %v", err)
	}
	// 调用 Interrupt
	s.Interrupt()
	// 之后执行应返回 "sandbox has been interrupted" 错误
	_, err = s.RunString("1 + 1")
	if err == nil {
		t.Error("Interrupt 后执行应返回错误")
	}
}

// ── Timeout ──

func TestSandbox_Timeout(t *testing.T) {
	s := NewSandbox(200 * time.Millisecond)
	_, err := s.RunString("while(true){}")
	if err == nil {
		t.Fatal("死循环应超时返回错误")
	}
}

func TestSandbox_Timeout_BlocksFurtherExecution(t *testing.T) {
	s := NewSandbox(100 * time.Millisecond)
	// 触发超时
	_, _ = s.RunString("while(true){}")
	// 超时后再次执行应返回 interrupted 错误
	_, err := s.RunString("1 + 1")
	if err == nil {
		t.Error("超时后执行应返回错误")
	}
}

// ── Runtime ──

func TestSandbox_Runtime(t *testing.T) {
	s := NewSandbox(5 * time.Second)
	rt := s.Runtime()
	if rt == nil {
		t.Error("Runtime() 不应返回 nil")
	}
}
