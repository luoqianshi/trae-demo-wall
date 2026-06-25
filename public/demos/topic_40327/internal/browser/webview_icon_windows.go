//go:build windows

package browser

import (
	"log"
	"syscall"
	"unsafe"
)

var (
	user32DLL   = syscall.NewLazyDLL("user32.dll")
	kernel32DLL = syscall.NewLazyDLL("kernel32.dll")

	procSendMessageW     = user32DLL.NewProc("SendMessageW")
	procLoadImageW       = user32DLL.NewProc("LoadImageW")
	procGetModuleHandleW = kernel32DLL.NewProc("GetModuleHandleW")
	procDestroyIcon      = user32DLL.NewProc("DestroyIcon")
)

const (
	WM_SETICON        = 0x0080
	ICON_BIG          = 1
	ICON_SMALL        = 0
	IMAGE_ICON        = 1
	LR_SHARED         = 0x00008000
	LR_LOADFROMFILE   = 0x00000010
	DEFAULT_ICON_SIZE = 0 // 使用系统默认尺寸
)

func setWindowIcon(hwnd unsafe.Pointer) {
	if hwnd == nil {
		return
	}

	var hIcon uintptr

	// 1. 尝试从可执行文件资源加载图标（需要 icon.syso）
	hModule, _, _ := procGetModuleHandleW.Call(0)
	if hModule != 0 {
		// 资源 ID 1 是 rsrc 工具生成的默认图标 ID
		hIcon, _, _ = procLoadImageW.Call(
			hModule,
			1, // 资源 ID
			IMAGE_ICON,
			DEFAULT_ICON_SIZE,
			DEFAULT_ICON_SIZE,
			LR_SHARED,
		)
	}

	// 2. 如果资源加载失败，尝试从 icon.ico 文件加载
	if hIcon == 0 {
		iconPath, err := syscall.UTF16PtrFromString("icon.ico")
		if err == nil {
			hIcon, _, _ = procLoadImageW.Call(
				0, // NULL hInstance for file loading
				uintptr(unsafe.Pointer(iconPath)),
				IMAGE_ICON,
				DEFAULT_ICON_SIZE,
				DEFAULT_ICON_SIZE,
				LR_LOADFROMFILE,
			)
		}
	}

	if hIcon == 0 {
		log.Println("[WebView] setWindowIcon: 无法加载图标")
		return
	}

	procSendMessageW.Call(uintptr(hwnd), WM_SETICON, ICON_BIG, hIcon)
	procSendMessageW.Call(uintptr(hwnd), WM_SETICON, ICON_SMALL, hIcon)
	log.Println("[WebView] setWindowIcon: 窗口图标设置成功")
}
