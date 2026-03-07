/**
 * 统一日志和错误处理工具
 * 生产环境自动禁用调试日志
 */

// 开发环境判断
const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface AppError {
  code: string
  message: string
  detail?: unknown
}

// 错误代码定义
export const ErrorCodes = {
  // 数据库相关
  DB_INIT_FAILED: 'DB_INIT_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_SAVE_FAILED: 'DB_SAVE_FAILED',

  // 认证相关
  AUTH_FAILED: 'AUTH_FAILED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // 文件解析
  PARSE_FAILED: 'PARSE_FAILED',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',

  // 表单验证
  VALIDATION_FAILED: 'VALIDATION_FAILED',

  // 通用
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

class Logger {
  private formatMessage(level: LogLevel, module: string, message: string): string {
    return `[${level.toUpperCase()}][${module}] ${message}`
  }

  debug(module: string, message: string, ...args: unknown[]): void {
    if (isDev) {
      console.log(this.formatMessage('debug', module, message), ...args)
    }
  }

  info(module: string, message: string, ...args: unknown[]): void {
    if (isDev) {
      console.info(this.formatMessage('info', module, message), ...args)
    }
  }

  warn(module: string, message: string, ...args: unknown[]): void {
    console.warn(this.formatMessage('warn', module, message), ...args)
  }

  error(module: string, message: string, error?: unknown): void {
    console.error(this.formatMessage('error', module, message), error || '')
  }
}

export const logger = new Logger()

// 创建应用错误
export function createError(code: keyof typeof ErrorCodes, message: string, detail?: unknown): AppError {
  return { code, message, detail }
}

// 错误消息映射
export const errorMessages: Record<string, string> = {
  [ErrorCodes.DB_INIT_FAILED]: '数据库初始化失败',
  [ErrorCodes.DB_QUERY_FAILED]: '数据查询失败',
  [ErrorCodes.DB_SAVE_FAILED]: '数据保存失败',
  [ErrorCodes.AUTH_FAILED]: '认证失败',
  [ErrorCodes.SESSION_EXPIRED]: '会话已过期',
  [ErrorCodes.PARSE_FAILED]: '文档解析失败',
  [ErrorCodes.UNSUPPORTED_FORMAT]: '不支持的文件格式',
  [ErrorCodes.VALIDATION_FAILED]: '表单验证失败',
  [ErrorCodes.UNKNOWN_ERROR]: '未知错误'
}

// 获取用户友好的错误消息
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const appError = error as AppError
    return errorMessages[appError.code] || appError.message
  }
  return errorMessages[ErrorCodes.UNKNOWN_ERROR]
}
