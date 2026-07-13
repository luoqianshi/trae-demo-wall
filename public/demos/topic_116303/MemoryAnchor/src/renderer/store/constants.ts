// Store Constants
// Shared constants for all stores - extracted to avoid circular dependencies

/**
 * 开发环境检测
 * 注意：Vite 会通过 define 注入 process.env.NODE_ENV
 */
export const isDev = process.env.NODE_ENV === 'development';
