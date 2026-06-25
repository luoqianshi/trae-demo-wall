//go:build !windows

package download

// CheckThunderAvailable 非 Windows 平台始终返回 false
func CheckThunderAvailable() bool {
	return false
}

// IsThunderAvailable 非 Windows 平台始终返回 false
func IsThunderAvailable() bool {
	return false
}
