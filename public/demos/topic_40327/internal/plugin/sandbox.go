package plugin

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/dop251/goja"

	"YaraFlow/internal/logger"
)

type Sandbox struct {
	vm          *goja.Runtime
	timeout     time.Duration
	mu          sync.RWMutex
	interrupted bool
}

func NewSandbox(timeout time.Duration) *Sandbox {
	vm := goja.New()
	s := &Sandbox{
		vm:      vm,
		timeout: timeout,
	}

	s.setupGlobals()
	return s
}

func (s *Sandbox) setupGlobals() {
	s.vm.Set("console", map[string]interface{}{
		"log": func(call goja.FunctionCall) goja.Value {
			args := make([]interface{}, len(call.Arguments))
			for i, arg := range call.Arguments {
				args[i] = arg.Export()
			}
			logger.Sugar.Infow("[JS]", "args", args)
			return goja.Undefined()
		},
		"warn": func(call goja.FunctionCall) goja.Value {
			args := make([]interface{}, len(call.Arguments))
			for i, arg := range call.Arguments {
				args[i] = arg.Export()
			}
			logger.Sugar.Warnw("[JS]", "args", args)
			return goja.Undefined()
		},
		"error": func(call goja.FunctionCall) goja.Value {
			args := make([]interface{}, len(call.Arguments))
			for i, arg := range call.Arguments {
				args[i] = arg.Export()
			}
			logger.Sugar.Warnw("[JS]", "args", args)
			return goja.Undefined()
		},
		"debug": func(call goja.FunctionCall) goja.Value {
			args := make([]interface{}, len(call.Arguments))
			for i, arg := range call.Arguments {
				args[i] = arg.Export()
			}
			logger.Sugar.Infow("[JS]", "args", args)
			return goja.Undefined()
		},
	})

	s.vm.Set("setTimeout", func(call goja.FunctionCall) goja.Value {
		panic(s.vm.NewTypeError("setTimeout is not available in plugin sandbox"))
	})
	s.vm.Set("setInterval", func(call goja.FunctionCall) goja.Value {
		panic(s.vm.NewTypeError("setInterval is not available in plugin sandbox"))
	})
}

func (s *Sandbox) RunString(script string) (goja.Value, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.interrupted {
		return nil, fmt.Errorf("sandbox has been interrupted")
	}

	ctx, cancel := context.WithTimeout(context.Background(), s.timeout)
	defer cancel()

	resultChan := make(chan struct {
		val goja.Value
		err error
	}, 1)

	go func() {
		defer func() { recover() }()
		val, err := s.vm.RunString(script)
		select {
		case resultChan <- struct {
			val goja.Value
			err error
		}{val, err}:
		default:
		}
	}()

	select {
	case result := <-resultChan:
		return result.val, result.err
	case <-ctx.Done():
		s.interrupted = true
		s.vm.Interrupt("execution timeout")
		return nil, fmt.Errorf("script execution timed out after %v", s.timeout)
	}
}

func (s *Sandbox) RunProgram(program *goja.Program) (goja.Value, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.interrupted {
		return nil, fmt.Errorf("sandbox has been interrupted")
	}

	ctx, cancel := context.WithTimeout(context.Background(), s.timeout)
	defer cancel()

	resultChan := make(chan struct {
		val goja.Value
		err error
	}, 1)

	go func() {
		defer func() { recover() }()
		val, err := s.vm.RunProgram(program)
		select {
		case resultChan <- struct {
			val goja.Value
			err error
		}{val, err}:
		default:
		}
	}()

	select {
	case result := <-resultChan:
		return result.val, result.err
	case <-ctx.Done():
		s.interrupted = true
		s.vm.Interrupt("execution timeout")
		return nil, fmt.Errorf("script execution timed out after %v", s.timeout)
	}
}

func (s *Sandbox) Compile(name, src string) (*goja.Program, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return goja.Compile(name, src, false)
}

func (s *Sandbox) Set(name string, value interface{}) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.vm.Set(name, value)
}

func (s *Sandbox) Get(name string) goja.Value {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.vm.Get(name)
}

func (s *Sandbox) Runtime() *goja.Runtime {
	return s.vm
}

func (s *Sandbox) Interrupt() {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.interrupted = true
	s.vm.Interrupt("sandbox interrupted")
}


